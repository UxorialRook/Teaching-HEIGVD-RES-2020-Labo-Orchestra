# Teaching-HEIGVD-RES-2020-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**. 
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Telegram / Teams, so that everyone in the class can benefit from the discussion.

## Objectives

This lab has 4 objectives:

* The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

* The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

* The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

* Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.


## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

* the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

* the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)


### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound         |
|------------|---------------|
| `piano`    | `ti-ta-ti`    |
| `trumpet`  | `pouet`       |
| `flute`    | `trulu`       |
| `violin`   | `gzi-gzi`     |
| `drum`     | `boum-boum`   |

### TCP-based protocol to be implemented by the Auditor application

* The auditor should include a TCP server and accept connection requests on port 2205.
* After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab


You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 5 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```
When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.


## Task 1: design the application architecture and protocols

| #  | Topic |
| --- | --- |
|Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands? |
| | *Insert your diagram here...* |
|Question | Who is going to **send UDP datagrams** and **when**? |
| | Chaque seconde, tous les musiciens envoient un datagramme UDP. |
|Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received? |
| | *L'auditeur écoute sur le port 2205. Lors de la réception du datagramme, il renvoie un payload JSON contenant la liste des musiciens acfifs.* |
|Question | What **payload** should we put in the UDP datagrams? |
| | **l'UUID du musicien, le nom de l'instrument qu'il est entrain de jouer. On peut aussi passer le timestamp actuel mais cela n'est pas nécessaire au bon fonctionneent de l'application. * |
|Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures? |
| | *L'auditeur a un Map qui possède un certains nombres de clés. Chaque clé correspond à un musicien actif (référencé par son UUID). Un musicien actif est représenté par un ensemble de propriétés: son UUID, son instrument, l'heure du premier paquet, et enfin l'heure de la dernière synchronisation. A la réception d'un datagramme, il va mettre à jour le musicien correspondant s'il trouve son UUID dans les clés du Map. S'il ne le trouve pas, il l'ajoute. Il faut aussi s'assurer que les musiciens plus actif depuis 5 secondes minumum soit supprimer.* |


## Task 2: implement a "musician" Node.js application

| #  | Topic |
| ---  | --- |
|Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**? |
| | *Comme un objet javascript est un objet JSON, on peut utiliser la fonction JSON.stringify() qui va transformer notre chaîne JSON en texte.*  |
|Question | What is **npm**?  |
| | *npm veut dire Node Package Manager. Il s'agit du gestionnaire de package de NODE. Il permet d'installer et de gérer différentes versions de package javascript.*  |
|Question | What is the `npm install` command and what is the purpose of the `--save` flag?  |
| | *npm install va installer le package demandé. Le flag --save permet de sauvegarder la dépendance dans le fichier package.json. Dans les dernières versions, c'est le comportement par défaut de NPM.  |
|Question | How can we use the `https://www.npmjs.com/` web site?  |
| | *Le site permet de rechercher des packages javascript. On peut ainsi chercher un module qui nous intéresserait et obtenir sa description, sa version, la date de sa dernière mise à jour, son auteur aisni que son repo github et la liste des ifférents collaborateurs.*  |
|Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122? |
| | *Il existe un module (https://www.npmjs.com/package/uuid) qui permet de générer des UUID compatible avec la norme RFC4122. On peut facilement l'installer avec NPM.*  |
|Question | In Node.js, how can we execute a function on a **periodic** basis? |
| | *En utilisant la fonction setInterval() disponible dans le module Timer fourni par défaut avec NodeJS.*  |
|Question | In Node.js, how can we **emit UDP datagrams**? |
| | *En utilisant le module dgram fourni avec NodeJS*  |
|Question | In Node.js, how can we **access the command line arguments**? |
| | *Les arguments se trouvent dans la propriété argv de l'objet process. L'objet process, est un objet global qui offre des informations et contrôle le processus NodeJS courant.*  |


## Task 3: package the "musician" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we **define and build our own Docker image**?|
| | *On définit une image docker à l'aide d'un fichier Dockerfile. Ce fichier va être utilisé par la commande docker build \<name\>\<context\>* utilisé pour construire l'image docker depuis un fichier de configuration. |
|Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?  |
| | *L'ENTRYPOINT est le point d'entrée de notre docker. Il s'agit de l'application qui va être exécuté au démarrage du container. Dans notre cas, il s'agit de notre application nodejs. On lui passe donc en premier paramètre le nom de l'exécutable (node) et en second les arguments, dans ce cas, le chemin vers notre script*  |
|Question | After building our Docker image, how do we use it to **run containers**?  |
| | *A l'aide de la commande docker run \<image\>. On peut lui préciser un certain nombre de paramètres si on  souhaite run l'image en interactive mode (-it) en dissocié (-d).*  |
|Question | How do we get the list of all **running containers**?  |
| | *Avec la commande docker ps*  |
|Question | How do we **stop/kill** one running container?  |
| | *Avec la commande stop/kill \<container_name\> ou \<container_id\>*  |
|Question | How can we check that our running containers are effectively sending UDP datagrams?  |
| | On peut déjà vérifier avec les logs (si on log l'envoie) que notre fonction est bien exécutée. (docker log \<container_name\>) Pour s'assurer que les datagrams UDP sont bien envoyés, on peut exécuter la commande tcpdump avec comme argument l'IP et le port choisi dans l'application. |


## Task 4: implement an "auditor" Node.js application

| #  | Topic |
| ---  | ---  |
|Question | With Node.js, how can we listen for UDP datagrams in a multicast group? |
| | *Une fois le serveur UDP (v.4) lancé, on peut utiliser la fonction bind pour qu'une fonction de callback soit appelée lorsque un datagram est reçu sur le port précisé.*  |
|Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?  |
| | *On peut utiliser l'objet Map pour stocker les différents musiciens actifs de l'orchestre. La clé étant l'UUID de chaque musicien et les données un objet représentant les différentes informations du musicien (instrument, timestamp].* |
|Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?  |
| | *On créé un objet moment au début de notre script en faisant un require() sur le module. Ensuite, on peut utiliser les différentes fonctions built-in pour générer, comparer différents dates/heures/timestamp..* |
|Question | When and how do we **get rid of inactive players**?  |
| | *Chaque 1 seconde, on regarde tous les musiciens qui n'ont pas été actifs depuis plus de 5 secondes. On connait cette information en observant l'heure de la dernière mise à jour (requête) effectuée par un musicien. Nous avons choisi de faire cette opération chaque 1 seconde pour garantir une suppression plus "rapide" de nos musiciens inactifs.* |
|Question | How do I implement a **simple TCP server** in Node.js?  |
| | *Il y'a plusieurs manière de le faire. Nous avons choisi de faire appel au module net fourni avec NodeJS. Il permet la création d'un serveur TCP en quelques lignes grâce à la commande net.createServer().* |


## Task 5: package the "auditor" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we validate that the whole system works, once we have built our Docker image? |
| | *Le script validate.sh nous permet de valider le comportement de l'application.* |


## Constraints

Please be careful to adhere to the specifications in this document, and in particular

* the Docker image names
* the names of instruments and their sounds
* the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should try to run it.
