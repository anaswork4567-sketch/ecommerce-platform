# E2E test script for ecommerce-platform
# Creates an order via Kong and polls payments and orders to verify processing

$kong = 'http://localhost:8000'

function Post-Order($userId, $productId, $quantity){
    $body = @{ user_id = $userId; product_id = $productId; quantity = $quantity; status = 'pending' } | ConvertTo-Json
    try{
        $res = Invoke-RestMethod -Method Post -Uri "$kong/orders" -Body $body -ContentType 'application/json' -UseBasicParsing
        return $res
    } catch {
        Write-Host "POST /orders failed:`n$($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Poll-For-Payment($orderId, $timeoutSec=10){
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while((Get-Date) -lt $deadline){
        try{
            $response = Invoke-RestMethod -Uri "$kong/payments" -UseBasicParsing
            # Handle both array and wrapped response
            $payments = if($response -is [array]) { $response } else { $response.value }
            $p = $payments | Where-Object { $_.order_id -eq $orderId }
            if($p){ return $p }
        } catch { }
        Start-Sleep -Seconds 1
    }
    return $null
}

function Poll-Order-Status($orderId, $timeoutSec=10){
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while((Get-Date) -lt $deadline){
        try{
            $response = Invoke-RestMethod -Uri "$kong/orders" -UseBasicParsing
            # Handle both array and wrapped response
            $orders = if($response -is [array]) { $response } else { $response.value }
            $o = $orders | Where-Object { $_.id -eq $orderId }
            if($o){ return $o }
        } catch { }
        Start-Sleep -Seconds 1
    }
    return $null
}

# Run test
Write-Host "Posting test order..."
$order = Post-Order -userId 1 -productId 1 -quantity 1
if(-not $order){ Write-Host 'Order POST failed — aborting' -ForegroundColor Red; exit 1 }
Write-Host "Order created with id: $($order.id)"

Write-Host "Polling for payment for order $($order.id)..."
$payment = Poll-For-Payment -orderId $order.id -timeoutSec 30
if($payment){
    Write-Host "Payment found:" -ForegroundColor Green
    $payment | Format-List
} else {
    Write-Host "No payment found within timeout" -ForegroundColor Yellow
}

Write-Host "Checking order status..."
$o = Poll-Order-Status -orderId $order.id -timeoutSec 30
if($o){
    Write-Host "Order status:" -ForegroundColor Green
    $o | Format-List
} else {
    Write-Host "Order not found within timeout" -ForegroundColor Yellow
}

if($payment -and $o -and $o.status -eq 'completed'){
    Write-Host "E2E test PASSED: payment created and order completed" -ForegroundColor Green
    exit 0
} else {
    Write-Host "E2E test FAILED" -ForegroundColor Red
    exit 2
}
