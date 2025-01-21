# online-tictactoe

#### Video Demo:  <(https://youtu.be/eP3kMT7mlac)>
#### Description:
**A web application runs an online TicTacToe game, using Django.**

This is my final project for CS50w.

## Distinctiveness and Complexity
Through this course, I learned several things about the internet and web development. I used most of this information and knowledge in this project. It satisfies the requirements because it is much more complex than the projects in this course. 

Let's start.

### Features:

- **WebSockets:** This project, since it's an online game, needs something to update the content of the web pages rendered to the user after the request is made. How can we do that? We need something new, something that establishes a direct connection between the server and the user that can communicate both ways, not the usual request/response HTTP model. How to solve this? I needed to learn WebSockets. This is a concept that makes this direct connection possible by creating a line of communication between the server and user that doesn't close the TCP layer on top. By that, we can, once upgrading the normal HTTP protocol to be a WebSocket protocol, receive data (messages) from the server without requesting it. I needed to research this because one of the solutions for the problem "How will the user know that the other user has already played?" is the 'polling' method, in which the user will send another HTTP request to the server, within a pre-established period of time, something like: "Is there a new play yet?" *5 seconds later* "Is there a new play yet?", until there's a new play.

  Since WebSocket is a much more advanced concept than the ones that were taught in this course, I needed to learn it the hard way. I read through tons of documentation that were more complex than my ability to understand. So, I discovered that the easiest way of learning how to make this type of connection is through Node.js.

- **Node.js:** This part isn't part of the project itself, but believe me, I needed it. I started learning Node.js, a tool that makes it possible to run JavaScript server-side. Why was it useful? Because creating a WebSocket connection with pure JS is one of the best ways to learn how it works (according to reliable sources). But since I didn't have a solid JavaScript base, I needed to review my concepts about the language and start learning the fundamentals. After that, since it's easy to create a running server with Django, as taught through this course, I had no idea how to create a live server with Node.js.

- **JavaScript:** I needed to learn a lot more about the language than I already did in order to understand Node.js. In this part, I learned from the MDN docs how Promises work, the order and differences between synchronous and asynchronous code, how to solve callback hells, and a lot of other stuff that wasn't taught in the CS50W course. I was surprised to see how much my coding skills needed improvement, with a lot of `if` statements and closing `}` curly braces all over the code. I learned how to use `async`, `await` and, most importantly, write readable and maintainable code. I was able to get rid of `if` chains and `.then()` chains, and separate my projects into folders to organize my thoughts in a better way.

   After learning more about the JavaScript language itself, I started learning how to create a server with Node.js. I learned a lot and was able to make an application that takes posts from the user and displays them on the front page. But this wasn't my objective. I needed the user to know that new posts were submitted. So, I started using the WebSocket connection in this project. Once I was able to make the handshake to upgrade HTTP -> WebSocket connection, I made it so that every client connected to this connection receives the message that is broadcasted. In other words, a big for loop. Once the message "database updated" was broadcasted to all users, I made it possible to fetch the database again to get the newest posts.
  
- **Django Channels :** The next step in the project was to use this new knowledge in a Django app. But, just to make things even more complicated, Django doesn't have native support for my latest discovery. I needed to use "Django Channels," a third-party library that makes it possible to work with WebSockets (and more) in Django, since it only works with HTTP natively. It proved that my time learning the differences and how to use async and sync code was useful, since it is pretty much what this library does. I needed to add an instruction for the URLs. If the URL is called in a normal, sync method, I redirected it to the normal `urls.py` file in the project directory. If not, it was redirected to the new `routing.py` file, which handles WebSocket requests. 

  But even with Django Channels, I wasn't able to do it as I pleased. I needed to talk between different instances of an application, and for that, I needed to use "channel layers," another feature from Django Channels that made it possible to send the WebSocket messages the way I intended. For that to work, I also needed to learn how to use Docker and use a channel layer that uses Redis as its backing store because "A channel is a mailbox where messages can be sent to. Each channel has a name. Anyone who has the name of a channel can send a message to the channel. A group is a group of related channels. A group has a name. Anyone who has the name of a group can add/remove a channel to the group by name and send a message to all channels in the group. It is not possible to enumerate what channels are in a particular group," and I needed this to make the game work. I followed this [tutorial](https://channels.readthedocs.io/en/latest/tutorial/part_1.html) to learn how to use WebSockets in the Django Channels API.

  So, it was quite a journey to finally make the WebSocket messages work the way I intended. This was quite an adventure into learning stuff before even starting to code. This is why this project fulfills the requirements for the final project. Most of the work necessary to make this TicTacToe game wasn't taught in the course. I was pleased to learn those new things, and I believe that it will be a great skill to have learned.WebSockets for real-time communication

  - Django Channels for WebSocket integration

  - Redis and Docker for managing channel layers

  - Advanced JavaScript and Node.js to understand the fundamentals of WebSockets

  These tools and technologies were not covered in the course, and their integration into the project demonstrates both the distinctiveness and the complexity of this application.

## Project Structure

Inside the `capstone` file, you'll see the following folders and files:

```text
├── game/
│   ├── __pycache__/
│   ├── migrations/
│   ├── static/
│   │   └── game/
│   │       ├── gameTable.js   
│   │       ├── index.js   
│   │       └── styles.css 
│   ├── templates/
│   │   └── game/
│   │       ├── error.html   
│   │       ├── game_table.html  
│   │       ├── index.html 
│   │       ├── layout.html  
│   │       ├── login.html   
│   │       └── register.html 
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── consumers.py
│   ├── models.py
│   ├── routing.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
│
├── project/
│   ├── __pycache__/ 
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│ 
├── db.sqlite3
├── manage.py
└── README.md
```

## 1. Project:

The folder for the Django project.

In this folder, we have several files, each with a specific function. Most of them are standard when building a Django project. Since we created many of these during the course, I will focus on those that introduce new concepts.

- ### wsgi.py  
  This file is responsible for configuring the WSGI (Web Server Gateway Interface), which is used to deploy the application in a production environment. It enables the project to handle traditional HTTP requests. This file is common in any Django application.

- ### asgi.py  
  This file is central to enabling WebSockets in this project. It configures the ASGI (Asynchronous Server Gateway Interface), which is required for handling asynchronous communication such as WebSockets. It uses the `ProtocolTypeRouter` to route different types of communication protocols. HTTP requests are handled using the default Django ASGI application, while WebSocket connections are routed via an `AuthMiddlewareStack` and the WebSocket URL patterns defined in the `game` app’s `routing.py` file.

- ### urls.py  
  This file maps requests to the appropriate apps. In this project, it has two paths: one that routes to the `game` app's routing file and the other for the admin panel.

---

## 2. Game:

The folder for the game app itself. It contains several subfolders and files essential to the application's functionality.

### **Subfolders:**

- ### `__pycache__`  
  Automatically created by Django to store compiled Python bytecode files.

- ### `migrations`  
  Contains migration files that track changes made to the models in this project.

- ### `static`  
  This folder contains important frontend files. Inside the `game` directory, we have:

  - `gameTable.js`  
  - `index.js`  
  - `styles.css`

  - **`index.js`**: Responsible for starting the WebSocket connection on the main page of the website. It fetches data from the database and renders existing games to the user. It relies on several functions to achieve this, with the most important being `initiateIndexSocket()`, which creates a new WebSocket request that is handled by `routing.py`.

  - **`gameTable.js`**: The most complex of the three. It performs the same tasks as `index.js` but for a specific game room. A game room consists of two connected users (channels) communicating through the server using WebSocket messages. It retrieves the current game state from the database, ensuring the game persists across window reloads. Additionally, it posts user moves and fetches data, which is then processed in `views.py`.

  - **`styles.css`**: Contains styling for the game grid and other visual elements.

- ### `templates`  
  Contains the HTML files rendered to the user. It includes a `layout.html` file to manage common elements across pages. Each HTML file corresponds to a specific JavaScript file.

---

### **Files:**

- ### `admin.py`  
  Used to register the app’s models so they can be managed in the Django admin interface.

- ### `apps.py`  
  A configuration file for the `game` app. It is automatically generated by Django.

- ### `consumers.py`  
  One of the most important files in the project. Similar to how each URL in `urls.py` maps to a view in `views.py`, each WebSocket route in `routing.py` maps to a consumer in this file. Consumers are like views for handling asynchronous WebSocket requests.  

  There are two consumers in this project:  
  1. **IndexConsumer**: Handles the general room where all users can see existing games.  
  2. **GameConsumer**: Manages individual game rooms, each consisting of two users. Since there can be multiple game rooms, this consumer uses channel layers to enable communication between users in a specific room.

- ### `models.py`  
  Defines the database models for the app. There are two models:  
  1. **Custom `User` model**  
  2. **`Game` model**: Includes custom serialization methods to handle data efficiently. Serialization was not covered deeply in the course, so this required additional research.

- ### `routing.py`  
  Maps WebSocket requests to the appropriate consumers. For example:  
  ```
  const indexSocket = new WebSocket(`ws://${window.location.host}/ws/index-room/`);
  const gameSocket = new WebSocket(`ws://${window.location.host}/ws/game-room/${gameId}`);
  ```
    
  We need to have a routing file that will point this request to the right consumer:
  ```
  websocket_urlpatterns = [
    re_path(r'ws/index-room/$', consumers.IndexConsumer.as_asgi()),
    re_path(r'^ws/game-room/(?P<game_id>\d+)$', consumers.GameConsumer.as_asgi()),
  ]
  ```

   This is what this file does. Basically the urls.py for the ws requests.

- ## urls.py
  Handles HTTP routes for the game app. These include functions unrelated to WebSockets, such as login, logout, user registration, creating games, joining games, updating games, and returning game data as JSON.

- ## views.py
  Contains server-side logic for handling HTTP requests and rendering responses. This is the core of the application, as it processes requests and sends back appropriate responses.


## How to run the application:
First thing, we need python3 and django and django channels installed:
`pip install python3`, `pip install django`, `python3 -m pip install -U 'channels[daphne]'`.
Then, follow this [tutorial](https://channels.readthedocs.io/en/latest/tutorial/part_2.html#enable-a-channel-layer) to enable a channel layer.
If your choice, run `docker run --rm -p 6379:6379 redis:7`. Then, `python3 manage.py runserver` and you can go to `http://localhost:8000/`, because your app is ready to run.


## I loved taking CS50w. I am Lucas and this is my project!
Thank you!
