from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Mock database - in memory
users = [
    {'id': 1, 'name': 'Anas', 'email': 'anas@example.com', 'role': 'admin'},
    {'id': 2, 'name': 'Abrar', 'email': 'abrar@example.com', 'role': 'user'},
    {'id': 3, 'name': 'Omer', 'email': 'omer@example.com', 'role': 'user'}
]

# GET all users
@app.route('/users', methods=['GET'])
def get_users():
    return jsonify(users), 200

# GET single user
@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user), 200

# CREATE new user
@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    new_user = {
        'id': max([u['id'] for u in users]) + 1,
        'name': data.get('name'),
        'email': data.get('email'),
        'role': data.get('role', 'user')
    }
    users.append(new_user)
    return jsonify(new_user), 201

# UPDATE user
@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    user['name'] = data.get('name', user['name'])
    user['email'] = data.get('email', user['email'])
    user['role'] = data.get('role', user['role'])
    
    return jsonify(user), 200

# DELETE user
@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    global users
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    users = [u for u in users if u['id'] != user_id]
    return jsonify({'message': 'User deleted', 'user': user}), 200

# HEALTH CHECK
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'User Service UP',
        'timestamp': datetime.now().isoformat(),
        'service': 'user-service'
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3002))
    app.run(debug=True, port=port, host='0.0.0.0')
