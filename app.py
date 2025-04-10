from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__)
socketio = SocketIO(app)

users = []

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def handle_join():
    users.append(request.sid)
    if len(users) == 1:
        emit('joined', True)
    elif len(users) == 2: 
        emit('joined', False, room=users[1])
    else:
        emit('joined', False)

@socketio.on('offer')
def handle_offer(data):
    emit('offer', data, broadcast=True, include_self=False)

@socketio.on('answer')
def handle_answer(data):
    emit('answer', data, broadcast=True, include_self=False)

@socketio.on('ice-candidate')
def handle_ice(data):
    emit('ice-candidate', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=10000)