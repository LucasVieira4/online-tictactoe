# online-tictactoe

#### Video Demo:  <(https://youtu.be/rsVYSWPfN38)>
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



## I loved taking CS50w. I am Lucas and this is my project!
Thank you!
