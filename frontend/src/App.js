import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Dialog,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Rating,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People";
import StorageIcon from "@mui/icons-material/Storage";
import PaymentIcon from "@mui/icons-material/Payment";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StarIcon from "@mui/icons-material/Star";

const API_BASES = {
  products: "http://localhost:8000",
  users: "http://localhost:8000",
  orders: "http://localhost:8000",
  payments: "http://localhost:8000",
};

const theme = createTheme({
  palette: {
    primary: {
      main: "#805A40",
      light: "#96711A",
      dark: "#4D2D2B",
    },
    secondary: {
      main: "#F5F0E6",
      light: "#FAFAF8",
      dark: "#D6B588",
    },
    success: {
      main: "#805A40",
    },
    warning: {
      main: "#96711A",
    },
    error: {
      main: "#4D2D2B",
    },
    background: {
      default: "#F5F0E6",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#4D2D2B",
      secondary: "#6B5344",
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: "1.75rem",
      color: "#000000",
      letterSpacing: "-0.5px",
    },
    h5: {
      fontWeight: 600,
      color: "#000000",
      letterSpacing: "-0.3px",
    },
    h6: {
      fontWeight: 600,
      color: "#000000",
    },
    body1: {
      color: "#333333",
      lineHeight: 1.6,
    },
    body2: {
      color: "#666666",
      lineHeight: 1.5,
    },
    caption: {
      color: "#999999",
      fontWeight: 500,
      fontSize: "0.75rem",
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "6px",
          transition: "all 0.3s ease",
          fontSize: "0.95rem",
        },
        contained: {
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(128, 90, 64, 0.15)",
            transform: "translateY(-1px)",
          },
        },
        outlined: {
          borderColor: "#D1D5DB",
          color: "#000000",
          "&:hover": {
            borderColor: "#805A40",
            backgroundColor: "#F9FAFB",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          transition: "all 0.3s ease",
          border: "1px solid #E8E8E8",
          backgroundColor: "#FFFFFF",
          "&:hover": {
            boxShadow: "0 10px 25px rgba(128, 90, 64, 0.12)",
            borderColor: "#D1D5DB",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          border: "1px solid #E8E8E8",
          backgroundColor: "#FFFFFF",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#FFFFFF",
            borderRadius: "6px",
            "& fieldset": {
              borderColor: "#D1D5DB",
            },
            "&:hover fieldset": {
              borderColor: "#1F3A93",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#1F3A93",
            },
          },
        },
      },
    },
  },
});

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

function App() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("12 OZ");
  const [selectedGrind, setSelectedGrind] = useState("whole-bean");
  const [productQuantity, setProductQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [cartNotification, setCartNotification] = useState("");
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderFromProductSelected, setOrderFromProductSelected] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [cartTotal, setCartTotal] = useState(0);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
  });

  const [newOrder, setNewOrder] = useState({
    userId: "",
    productId: "",
    quantity: 1,
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "user",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [p, u, o, pay] = await Promise.all([
        fetchJson(`${API_BASES.products}/products`),
        fetchJson(`${API_BASES.users}/users`),
        fetchJson(`${API_BASES.orders}/orders`),
        fetchJson(`${API_BASES.payments}/payments`),
      ]);

      setProducts(p);
      setUsers(u);
      setOrders(o);
      setPayments(pay);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!selectedProduct) return;

    const cartItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: productQuantity,
      totalPrice: selectedProduct.price * productQuantity,
    };

    // Check if item already exists in cart
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === selectedProduct.id);
      if (existingItem) {
        // Update quantity if item exists
        return prevCart.map((item) =>
          item.id === selectedProduct.id
            ? {
                ...item,
                quantity: item.quantity + productQuantity,
                totalPrice: item.price * (item.quantity + productQuantity),
              }
            : item
        );
      } else {
        // Add new item
        return [...prevCart, cartItem];
      }
    });

    // Show notification
    setCartNotification(`${selectedProduct.name} added to cart!`);
    setTimeout(() => setCartNotification(""), 3000);

    // Close modal and reset
    setProductModalOpen(false);
    setProductQuantity(1);
  }

  async function handleCheckout() {
    if (cart.length === 0) return;

    // Calculate total
    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    setCartTotal(total);

    // Show payment dialog
    setShowPaymentDialog(true);
  }

  async function handlePaymentConfirm() {
    if (!selectedPaymentMethod) return;

    setCheckoutProcessing(true);

    try {
      // Get the first user from the system (for cart checkout)
      if (users.length === 0) {
        throw new Error("No users available. Please create a user first.");
      }

      const defaultUser = users[0];

      const paymentMethodMap = {
        upi: "UPI",
        credit_card: "Credit Card",
        cash: "Cash on Delivery",
      };

      // Create orders for all items in cart
      for (const item of cart) {
        await fetch(`${API_BASES.orders}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: defaultUser.id,
            product_id: item.id,
            quantity: item.quantity,
            payment_method: selectedPaymentMethod,
            amount: item.price * item.quantity,
            status: "pending",
          }),
        });
      }

      // Create payment record
      await fetch(`${API_BASES.payments}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: defaultUser.id, // Using user id as a simple reference
          amount: cartTotal,
          status: "completed",
          method: paymentMethodMap[selectedPaymentMethod],
        }),
      });

      setCheckoutProcessing(false);
      setShowPaymentDialog(false);
      setOrderCompleted(true);
      
      // Clear cart after successful order
      setCart([]);

      // Show success notification
      setCartNotification(`Order completed! Paid via ${paymentMethodMap[selectedPaymentMethod]}`);
      
      // Reload data to show new orders
      await loadData();
      
      // Auto-hide the completion message after 5 seconds
      setTimeout(() => {
        setOrderCompleted(false);
        setCartNotification("");
        setSelectedPaymentMethod("upi");
      }, 5000);
    } catch (err) {
      setCheckoutProcessing(false);
      setShowPaymentDialog(false);
      setError(err.message);
    }
  }

  async function handlePlaceOrderFromProduct() {
    if (!orderFromProductSelected || !orderFromProductSelected.userId) {
      setError("Please select a user to place the order");
      return;
    }

    // Calculate and set the total for this product order
    const orderTotal = selectedProduct.price * orderFromProductSelected.quantity;
    setCartTotal(orderTotal);

    // Show payment dialog
    setShowOrderDialog(false);
    setShowPaymentDialog(true);
  }

  async function handleProductOrderPaymentConfirm() {
    if (!selectedPaymentMethod || !orderFromProductSelected) return;

    try {
      setProcessingOrder(true);

      const paymentMethodMap = {
        upi: "UPI",
        credit_card: "Credit Card",
        cash: "Cash on Delivery",
      };

      // Create order
      const res = await fetch(`${API_BASES.orders}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(orderFromProductSelected.userId),
          product_id: Number(orderFromProductSelected.productId),
          quantity: Number(orderFromProductSelected.quantity),
          payment_method: selectedPaymentMethod,
          amount: cartTotal,
          status: "pending",
        }),
      });

      if (!res.ok) {
        throw new Error(`Order create failed: ${res.status}`);
      }

      const orderData = await res.json();

      // Create payment record
      await fetch(`${API_BASES.payments}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderData.id || Number(orderFromProductSelected.userId),
          amount: cartTotal,
          status: "completed",
          method: paymentMethodMap[selectedPaymentMethod],
        }),
      });

      setShowPaymentDialog(false);
      setOrderCompleted(true);
      setOrderFromProductSelected(null);
      setProductModalOpen(false);
      setSelectedProduct(null);

      // Show success notification
      setCartNotification(`Order placed! Paid via ${paymentMethodMap[selectedPaymentMethod]}`);

      // Reload data
      await loadData();

      // Auto-hide the completion message after 5 seconds
      setTimeout(() => {
        setOrderCompleted(false);
        setCartNotification("");
        setSelectedPaymentMethod("upi");
        setProcessingOrder(false);
      }, 5000);
    } catch (err) {
      setError(err.message);
      setShowPaymentDialog(false);
      setProcessingOrder(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateProduct(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASES.products}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock),
        }),
      });

      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const created = await res.json();

      setProducts((prev) => [...prev, created]);
      setNewProduct({ name: "", price: "", stock: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleIncreaseStock(id) {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const updated = { ...product, stock: product.stock + 1 };

    try {
      const res = await fetch(`${API_BASES.products}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error(`Update failed: ${res.status}`);

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteProduct(id) {
    try {
      const res = await fetch(`${API_BASES.products}/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateOrder(e) {
    e.preventDefault();

    try {
      setProcessingOrder(true);
      const res = await fetch(`${API_BASES.orders}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(newOrder.userId),
          product_id: Number(newOrder.productId),
          quantity: Number(newOrder.quantity),
          status: "pending",
        }),
      });

      if (!res.ok) {
        throw new Error(`Order create failed: ${res.status}`);
      }

      await res.json();
      setNewOrder({ userId: "", productId: "", quantity: 1 });

      setTimeout(() => {
        loadData();
        setProcessingOrder(false);
      }, 5000);
    } catch (err) {
      setError(err.message);
      setProcessingOrder(false);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASES.users}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }),
      });

      if (!res.ok) throw new Error(`User create failed: ${res.status}`);
      const created = await res.json();

      setUsers((prev) => [...prev, created]);
      setNewUser({ name: "", email: "", role: "user" });
    } catch (err) {
      setError(err.message);
    }
  }

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ backgroundColor: "#F5F0E6", minHeight: "100vh" }}>
        <AppBar position="static" sx={{ background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderBottom: "1px solid #E8E8E8" }}>
        <Toolbar sx={{ py: 1.5, px: 3 }}>
          <ShoppingCartIcon sx={{ mr: 1.5, fontSize: 28, color: "#805A40" }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: "#4D2D2B", letterSpacing: 0 }}>
              eStore
            </Typography>
            <Typography variant="caption" sx={{ color: "#96711A", fontSize: "0.7rem" }}>
              Curated Marketplace
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" sx={{ color: "#6B5344" }}>
              Status: <span style={{ color: "#22C55E", fontWeight: 600 }}>● Live</span>
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {cartNotification && (
        <Alert severity="success" sx={{ m: 2, backgroundColor: "#22C55E", color: "white" }}>
          {cartNotification}
        </Alert>
      )}

      <Container maxWidth="lg" sx={{ py: 3, backgroundColor: "#F5F0E6", minHeight: "100vh" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#805A40" }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && (
          <>
            {/* Navigation Tabs */}
            <Paper sx={{ mb: 3, backgroundColor: "#FFFFFF" }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: "2px solid #E0E0E0",
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    color: "#6B5344",
                    textTransform: "none",
                    transition: "all 0.3s ease",
                    "&.Mui-selected": {
                      color: "#4D2D2B",
                      borderBottom: "2px solid #805A40",
                    }
                  }
                }}
              >
                <Tab label="Dashboard" value="dashboard" />
                <Tab label="Products" value="products" />
                <Tab label="Users" value="users" />
                <Tab label="Orders" value="orders" />
                <Tab label="Payments" value="payments" />
                <Tab label={`Cart (${cart.length})`} value="cart" />
              </Tabs>
            </Paper>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
            <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3 }}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Total Products
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: "#4D2D2B" }}>
                          {products.length}
                        </Typography>
                      </Box>
                      <StorageIcon sx={{ fontSize: 40, color: "#D6B588", opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3 }}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Total Users
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: "#4D2D2B" }}>
                          {users.length}
                        </Typography>
                      </Box>
                      <PersonIcon sx={{ fontSize: 40, color: "#D6B588", opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3 }}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Total Orders
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: "#4D2D2B" }}>
                          {orders.length}                        </Typography>
                      </Box>
                      <ShoppingCartIcon sx={{ fontSize: 40, color: "#E8E8E8", opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3 }}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Total Revenue
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: "#4D2D2B" }}>
                          ₹{totalRevenue}
                        </Typography>
                      </Box>
                      <PaymentIcon sx={{ fontSize: 40, color: "#D6B588", opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Analytics Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Profit Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3, borderTop: "3px solid #805A40" }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Total Profit
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#4D2D2B", mb: 1 }}>
                      ₹{Math.max(0, totalRevenue - (orders.length * 5000))}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#96711A" }}>
                      Based on avg order cost
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Loss Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3, borderTop: "3px solid #805A40" }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Total Cost
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#4D2D2B", mb: 1 }}>
                      ₹{orders.length * 5000}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#96711A" }}>
                      {orders.length} orders × ₹5000
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Profit Margin Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3, borderTop: "3px solid #805A40" }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Profit Margin
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#4D2D2B", mb: 1 }}>
                      {orders.length === 0 ? "0" : Math.round(((totalRevenue - (orders.length * 5000)) / totalRevenue) * 100)}%
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#96711A" }}>
                      Profit / Revenue
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Avg Order Value Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3, borderTop: "3px solid #805A40" }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Avg Order Value
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#4D2D2B", mb: 1 }}>
                      ₹{orders.length === 0 ? 0 : Math.round(totalRevenue / orders.length)}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#96711A" }}>
                      Per order average
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Conversion Rate Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3, borderTop: "3px solid #805A40" }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#96711A", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Conversion Rate
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#4D2D2B", mb: 1 }}>
                      {users.length === 0 ? "0" : Math.round((orders.length / users.length) * 100)}%
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#96711A" }}>
                      Orders / Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Payment Success Rate */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ backgroundColor: "#FFFFFF", p: 3, borderTop: "3px solid #805A40" }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#999999", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Payment Success
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#000000", mb: 1 }}>
                      {payments.length === 0 ? "0" : Math.round((payments.filter(p => p.status === "completed").length / payments.length) * 100)}%
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#999999" }}>
                      Completed / Total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            </>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
            <>
            <Paper sx={{ p: 4, mb: 3, backgroundColor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3, pb: 2, borderBottom: "1px solid #E8E8E8" }}>
                <StorageIcon sx={{ mr: 2, color: "#805A40", fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#4D2D2B" }}>
                  Products
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", backgroundColor: "#F5F5F5", p: 3, borderRadius: "8px" }}>
                <TextField
                  label="Name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{ 
                    backgroundColor: "white",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#1F2937" },
                    }
                  }}
                />
                <TextField
                  label="Price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{ 
                    backgroundColor: "white",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#1F2937" },
                    }
                  }}
                />
                <TextField
                  label="Stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: e.target.value })
                  }
                  size="small"
                  variant="outlined"
                  sx={{ 
                    backgroundColor: "white",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#1F3A93" },
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleCreateProduct}
                  startIcon={<AddIcon />}
                  sx={{ backgroundColor: "#805A40", color: "white", fontWeight: 600 }}
                >
                  Add Product
                </Button>
              </Box>

              {products.length === 0 ? (
                <Typography sx={{ p: 2, color: "#999999" }}>No products yet</Typography>
              ) : (
                <Grid container spacing={3}>
                  {products.map((p) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                      <Card 
                        sx={{ 
                          height: "100%", 
                          display: "flex", 
                          flexDirection: "column",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-8px)",
                            boxShadow: "0 15px 30px rgba(128, 90, 64, 0.15)",
                          }
                        }}
                        onClick={() => {
                          setSelectedProduct(p);
                          setProductModalOpen(true);
                          setSelectedSize("12 OZ");
                          setSelectedGrind("whole-bean");
                          setProductQuantity(1);
                        }}
                      >
                        <Box
                          sx={{
                            height: 250,
                            backgroundColor: "#F5F0E6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              background: `linear-gradient(135deg, #805A40 0%, #96711A 100%)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography variant="h2" sx={{ color: "white", opacity: 0.2, fontWeight: 700 }}>
                              {p.name.charAt(0)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              backgroundColor: "#805A40",
                              color: "white",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            {p.stock} in stock
                          </Box>
                        </Box>

                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: "#4D2D2B" }}>
                            {p.name}
                          </Typography>

                          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                            <Rating value={4.5} readOnly size="small" sx={{ mr: 1 }} />
                            <Typography variant="caption" sx={{ color: "#999999", fontWeight: 500 }}>
                              4.5 (24)
                            </Typography>
                          </Box>

                          <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000" }}>
                            ₹{p.price}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>

            {/* Product Detail Modal */}
            <Dialog
              open={productModalOpen}
              onClose={() => setProductModalOpen(false)}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                }
              }}
            >
              {selectedProduct && (
                <Box sx={{ display: "flex" }}>
                  {/* Product Image Section */}
                  <Box
                    sx={{
                      flex: 1,
                      backgroundColor: "#F9FAFB",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 500,
                      position: "relative",
                      background: `linear-gradient(135deg, #805A40 0%, #96711A 100%)`,
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h1" sx={{ color: "white", opacity: 0.15, fontWeight: 700 }}>
                        {selectedProduct.name.charAt(0)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Product Details Section */}
                  <Box sx={{ flex: 1, p: 4, display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 3 }}>
                      <Box>
                        <Typography variant="overline" sx={{ color: "#96711A", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "1px" }}>
                          Premium Selection
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: "#4D2D2B", mt: 1 }}>
                          {selectedProduct.name}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => setProductModalOpen(false)}
                        sx={{ color: "#96711A", fontSize: "1.2rem" }}
                      >
                        ✕
                      </Button>
                    </Box>

                    {/* Reviews */}
                    <Box sx={{ mb: 3, pb: 3, borderBottom: "1px solid #E8E8E8" }}>
                      <Typography variant="caption" sx={{ color: "#999999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Reviews
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                        <Rating value={4.5} readOnly size="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#000000" }}>
                          4.9 (24 reviews)
                        </Typography>
                      </Box>
                    </Box>

                    {/* Price */}
                    <Box sx={{ mb: 3, pb: 3, borderBottom: "1px solid #E8E8E8" }}>
                      <Typography variant="caption" sx={{ color: "#999999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Price
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: "#000000", mt: 1 }}>
                        ₹{selectedProduct.price}
                      </Typography>
                    </Box>

                    {/* Quantity */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="caption" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 1.5 }}>
                        Quantity
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Button
                          size="small"
                          onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                          sx={{ minWidth: "40px", color: "#805A40", fontWeight: 700 }}
                        >
                          −
                        </Button>
                        <TextField
                          type="number"
                          value={productQuantity}
                          onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          size="small"
                          sx={{ width: "60px", textAlign: "center" }}
                          inputProps={{ style: { textAlign: "center" } }}
                        />
                        <Button
                          size="small"
                          onClick={() => setProductQuantity(productQuantity + 1)}
                          sx={{ minWidth: "40px", color: "#805A40", fontWeight: 700 }}
                        >
                          +
                        </Button>
                      </Box>
                    </Box>

                    {/* Add to Cart Button */}
                    {/* Add to Cart and Order Now Buttons */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleAddToCart}
                        sx={{
                          backgroundColor: "#805A40",
                          color: "white",
                          fontWeight: 700,
                          py: 2,
                          fontSize: "1rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          "&:hover": { 
                            backgroundColor: "#4D2D2B",
                            boxShadow: "0 8px 16px rgba(128, 90, 64, 0.25)"
                          }
                        }}
                      >
                        ADD TO CART - ₹{(selectedProduct.price * productQuantity).toLocaleString()}
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          setOrderFromProductSelected({
                            productId: selectedProduct.id,
                            quantity: productQuantity,
                            userId: "",
                          });
                          setShowOrderDialog(true);
                        }}
                        sx={{
                          borderColor: "#805A40",
                          color: "#805A40",
                          fontWeight: 700,
                          py: 2,
                          fontSize: "1rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          "&:hover": { 
                            backgroundColor: "#F5F0E6",
                            borderColor: "#4D2D2B"
                          }
                        }}
                      >
                        ORDER NOW
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Dialog>
            </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
            <Paper sx={{ p: 4, mb: 3, backgroundColor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <PeopleIcon sx={{ color: "#805A40", fontSize: 28 }} />
                <Typography variant="h5" sx={{ color: "#4D2D2B", fontWeight: 700 }}>
                  Users
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <TextField
                  label="Name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#805A40" },
                      "&.Mui-focused fieldset": { borderColor: "#805A40" }
                    }
                  }}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#805A40" },
                      "&.Mui-focused fieldset": { borderColor: "#805A40" }
                    }
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    label="Role"
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleCreateUser}
                  startIcon={<AddIcon />}
                  sx={{
                    backgroundColor: "#805A40",
                    color: "white",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#4D2D2B" }
                  }}
                >
                  Add User
                </Button>
              </Box>

              {users.length === 0 ? (
                <Typography color="textSecondary">No users</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#F5F0E6" }}>
                      <TableRow>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>ID</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Name</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Email</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Role</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell sx={{ color: "#4D2D2B" }}>{u.id}</TableCell>
                          <TableCell sx={{ color: "#4D2D2B" }}>{u.name}</TableCell>
                          <TableCell sx={{ color: "#4D2D2B" }}>{u.email}</TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{
                                backgroundColor: u.role === "admin" ? "#805A40" : "#F5F0E6",
                                color: u.role === "admin" ? "white" : "#805A40",
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1,
                              }}
                            >
                              {u.role}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
            <Paper sx={{ p: 4, mb: 3, backgroundColor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <ShoppingCartIcon sx={{ color: "#805A40", fontSize: 28 }} />
                <Typography variant="h5" sx={{ color: "#4D2D2B", fontWeight: 700 }}>
                  Orders
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>User</InputLabel>
                  <Select
                    value={newOrder.userId}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, userId: e.target.value })
                    }
                    label="User"
                  >
                    {users.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={newOrder.productId}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, productId: e.target.value })
                    }
                    label="Product"
                  >
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} – ₹{p.price}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Quantity"
                  type="number"
                  value={newOrder.quantity}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, quantity: e.target.value })
                  }
                  size="small"
                  inputProps={{ min: 1 }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#805A40" },
                      "&.Mui-focused fieldset": { borderColor: "#805A40" }
                    }
                  }}
                />

                <Button
                  variant="contained"
                  onClick={handleCreateOrder}
                  startIcon={<ShoppingCartIcon />}
                  sx={{
                    backgroundColor: "#805A40",
                    color: "white",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#4D2D2B" }
                  }}
                >
                  Place Order
                </Button>
              </Box>

              {orders.length === 0 ? (
                <Typography color="textSecondary">No orders</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#F5F0E6" }}>
                      <TableRow>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>ID</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>User ID</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Product ID</TableCell>
                        <TableCell align="right" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Qty</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell sx={{ color: "#4D2D2B" }}>{o.id}</TableCell>
                          <TableCell sx={{ color: "#4D2D2B" }}>{o.user_id}</TableCell>
                          <TableCell sx={{ color: "#4D2D2B" }}>{o.product_id}</TableCell>
                          <TableCell align="right" sx={{ color: "#4D2D2B" }}>{o.quantity}</TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{
                                backgroundColor: o.status === "completed" ? "#22C55E" : "#E5E7EB",
                                color: o.status === "completed" ? "white" : "#000000",
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1,
                                fontWeight: 600
                              }}
                            >
                              {o.status}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
            <Paper sx={{ p: 4, mb: 3, backgroundColor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <CreditCardIcon sx={{ color: "#805A40", fontSize: 28 }} />
                <Typography variant="h5" sx={{ color: "#4D2D2B", fontWeight: 700 }}>
                  Payments
                </Typography>
              </Box>

              {payments.length === 0 ? (
                <Typography color="textSecondary">No payments</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#F5F0E6" }}>
                      <TableRow>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>ID</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Order ID</TableCell>
                        <TableCell align="right" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Amount</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Status</TableCell>
                        <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Method</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell sx={{ color: "#4D2D2B" }}>{p.id}</TableCell>
                          <TableCell sx={{ color: "#4D2D2B" }}>{p.order_id}</TableCell>
                          <TableCell align="right" sx={{ color: "#4D2D2B", fontWeight: 600 }}>₹{p.amount}</TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{
                                backgroundColor: "#22C55E",
                                color: "white",
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1,
                                fontWeight: 600
                              }}
                            >
                              {p.status}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: "#4D2D2B" }}>{p.method}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
            )}

            {/* Cart Tab */}
            {activeTab === "cart" && (
            <Paper sx={{ p: 4, mb: 3, backgroundColor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <ShoppingCartIcon sx={{ color: "#805A40", fontSize: 28 }} />
                <Typography variant="h5" sx={{ color: "#4D2D2B", fontWeight: 700 }}>
                  Shopping Cart
                </Typography>
              </Box>

              {cart.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <ShoppingCartIcon sx={{ fontSize: 80, color: "#E8E8E8", opacity: 0.5, mb: 2 }} />
                  <Typography color="textSecondary" sx={{ fontSize: "1.1rem" }}>
                    Your cart is empty
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ backgroundColor: "#F5F0E6" }}>
                        <TableRow>
                          <TableCell sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Product Name</TableCell>
                          <TableCell align="right" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Price</TableCell>
                          <TableCell align="center" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Quantity</TableCell>
                          <TableCell align="right" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Total</TableCell>
                          <TableCell align="center" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell sx={{ color: "#4D2D2B" }}>{item.name}</TableCell>
                            <TableCell align="right" sx={{ color: "#4D2D2B" }}>₹{item.price}</TableCell>
                            <TableCell align="center" sx={{ color: "#4D2D2B" }}>{item.quantity}</TableCell>
                            <TableCell align="right" sx={{ color: "#4D2D2B", fontWeight: 600 }}>₹{item.totalPrice.toLocaleString()}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => setCart((prev) => prev.filter((i) => i.id !== item.id))}
                                sx={{ color: "#4D2D2B" }}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 4, pt: 3, borderTop: "2px solid #E8E8E8", textAlign: "right" }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#4D2D2B", mb: 2 }}>
                      Total: ₹{cart.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleCheckout}
                      disabled={checkoutProcessing}
                      sx={{
                        backgroundColor: "#805A40",
                        color: "white",
                        fontWeight: 600,
                        py: 1.5,
                        px: 4,
                        "&:hover": { backgroundColor: "#4D2D2B" },
                        "&:disabled": { backgroundColor: "#D6B588", opacity: 0.7 }
                      }}
                    >
                      {checkoutProcessing ? "Processing..." : "Proceed to Checkout"}
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
            )}
          </>
        )}

        {/* Processing Order Dialog */}
        <Dialog 
          open={processingOrder} 
          PaperProps={{
            sx: {
              background: "linear-gradient(135deg, #805A40 0%, #96711A 100%)",
              boxShadow: "0 20px 60px rgba(128, 90, 64, 0.4)",
              borderRadius: "16px",
            }
          }}
        >
          <DialogContent sx={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            p: 4,
            minWidth: "300px",
          }}>
            <CircularProgress sx={{ mb: 2, color: "white" }} size={60} />
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600, textAlign: "center" }}>
              Processing Order...
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 1, textAlign: "center" }}>
              Waiting for payment confirmation
            </Typography>
          </DialogContent>
        </Dialog>

        {/* Checkout Processing Dialog */}
        <Dialog 
          open={checkoutProcessing} 
          PaperProps={{
            sx: {
              background: "linear-gradient(135deg, #805A40 0%, #96711A 100%)",
              boxShadow: "0 20px 60px rgba(128, 90, 64, 0.4)",
              borderRadius: "16px",
            }
          }}
        >
          <DialogContent sx={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            p: 4,
            minWidth: "300px",
          }}>
            <CircularProgress sx={{ mb: 2, color: "white" }} size={60} />
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600, textAlign: "center" }}>
              Processing Checkout...
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 1, textAlign: "center" }}>
              Please wait while we process your order
            </Typography>
          </DialogContent>
        </Dialog>

        {/* Payment Method Dialog */}
        <Dialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: "#4D2D2B", borderBottom: "1px solid #E8E8E8" }}>
            Select Payment Method
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3, p: 2, backgroundColor: "#F5F0E6", borderRadius: "6px" }}>
              <Typography variant="caption" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", display: "block", mb: 1 }}>
                Order Total
              </Typography>
              <Typography variant="h4" sx={{ color: "#805A40", fontWeight: 700 }}>
                ₹{cartTotal.toLocaleString()}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: "#6B5344", mb: 2, fontWeight: 600 }}>
              Choose your payment method:
            </Typography>

            {/* Payment Options */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
              {/* UPI Option */}
              <Box
                onClick={() => setSelectedPaymentMethod("upi")}
                sx={{
                  p: 2,
                  border: selectedPaymentMethod === "upi" ? "2px solid #805A40" : "1px solid #E8E8E8",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: selectedPaymentMethod === "upi" ? "#F5F0E6" : "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#805A40",
                    backgroundColor: "#F5F0E6",
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "2px solid #805A40",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {selectedPaymentMethod === "upi" && (
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#805A40" }} />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#4D2D2B" }}>
                      UPI
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6B5344" }}>
                      Pay using UPI (Google Pay, PhonePe, etc.)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Credit Card Option */}
              <Box
                onClick={() => setSelectedPaymentMethod("credit_card")}
                sx={{
                  p: 2,
                  border: selectedPaymentMethod === "credit_card" ? "2px solid #805A40" : "1px solid #E8E8E8",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: selectedPaymentMethod === "credit_card" ? "#F5F0E6" : "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#805A40",
                    backgroundColor: "#F5F0E6",
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "2px solid #805A40",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {selectedPaymentMethod === "credit_card" && (
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#805A40" }} />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#4D2D2B" }}>
                      Credit / Debit Card
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6B5344" }}>
                      Visa, MasterCard, American Express
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Cash on Delivery Option */}
              <Box
                onClick={() => setSelectedPaymentMethod("cash")}
                sx={{
                  p: 2,
                  border: selectedPaymentMethod === "cash" ? "2px solid #805A40" : "1px solid #E8E8E8",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: selectedPaymentMethod === "cash" ? "#F5F0E6" : "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#805A40",
                    backgroundColor: "#F5F0E6",
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "2px solid #805A40",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {selectedPaymentMethod === "cash" && (
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#805A40" }} />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#4D2D2B" }}>
                      Cash on Delivery
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6B5344" }}>
                      Pay when your order arrives
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setShowPaymentDialog(false);
                  if (orderFromProductSelected) {
                    setShowOrderDialog(true);
                  }
                }}
                sx={{ color: "#805A40", borderColor: "#805A40" }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  if (orderFromProductSelected) {
                    handleProductOrderPaymentConfirm();
                  } else {
                    handlePaymentConfirm();
                  }
                }}
                disabled={checkoutProcessing || processingOrder}
                sx={{
                  backgroundColor: "#805A40",
                  color: "white",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#4D2D2B" },
                  "&:disabled": { backgroundColor: "#D6B588", opacity: 0.7 },
                }}
              >
                {checkoutProcessing || processingOrder ? "Processing..." : "Confirm Payment"}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Place Order Dialog */}
        <Dialog
          open={showOrderDialog}
          onClose={() => setShowOrderDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: "#4D2D2B", borderBottom: "1px solid #E8E8E8" }}>
            Place Order
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: "#6B5344", mb: 3 }}>
              Select a user to place this order for:
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: "#96711A" }}>Select User</InputLabel>
              <Select
                value={orderFromProductSelected?.userId || ""}
                onChange={(e) =>
                  setOrderFromProductSelected((prev) => ({
                    ...prev,
                    userId: e.target.value,
                  }))
                }
                label="Select User"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: "#805A40" },
                  },
                }}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 2, p: 2, backgroundColor: "#F5F0E6", borderRadius: "6px" }}>
              <Typography variant="caption" sx={{ color: "#96711A", fontWeight: 600, textTransform: "uppercase", display: "block", mb: 1 }}>
                Order Summary
              </Typography>
              <Typography variant="body2" sx={{ color: "#4D2D2B", mb: 0.5 }}>
                Product: {selectedProduct?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#4D2D2B", mb: 0.5 }}>
                Quantity: {orderFromProductSelected?.quantity}
              </Typography>
              <Typography variant="h6" sx={{ color: "#805A40", fontWeight: 700 }}>
                Total: ₹{(selectedProduct?.price * (orderFromProductSelected?.quantity || 1)).toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowOrderDialog(false)}
                sx={{ color: "#805A40", borderColor: "#805A40" }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handlePlaceOrderFromProduct}
                disabled={!orderFromProductSelected?.userId}
                sx={{
                  backgroundColor: "#805A40",
                  color: "white",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#4D2D2B" },
                  "&:disabled": { backgroundColor: "#D6B588", opacity: 0.7 },
                }}
              >
                Place Order
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Order Completion Dialog */}
        <Dialog 
          open={orderCompleted}
          PaperProps={{
            sx: {
              background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
              boxShadow: "0 20px 60px rgba(34, 197, 94, 0.4)",
              borderRadius: "16px",
            }
          }}
        >
          <DialogContent sx={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            p: 4,
            minWidth: "350px",
          }}>
            <Box sx={{ mb: 2, fontSize: "4rem" }}>✓</Box>
            <Typography variant="h5" sx={{ color: "white", fontWeight: 700, textAlign: "center", mb: 1 }}>
              Order Completed!
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", textAlign: "center", mb: 2 }}>
              Thank you for your purchase. Your order has been successfully placed.
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
              You will be redirected shortly...
            </Typography>
          </DialogContent>
        </Dialog>
      </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
