# dh-server

Node.js multi-sources monitoring and reporting system.

## Installation

It is a work in progress ...

git clone and then :
```sh
$ npm install
```

## Configuration

Copy config-sample.js to config.js and modify it.

## Storage

One or many of the defined storage plugins. The simple is File system.

### File system

By default we use "./Files" directory (see config-sample.js)

### PostgreSQL (TODO)

Create database, give access to chosen user and then :
```sh
$ psql -W -h <host> -U <user> <database name> < sql/schema_base.sql
```

## Run

```sh
$ node server.js
```

DomoHub use debug node module, so you can debug modules with :

```sh
$ DEBUG=main,httpserver node server.js
```

## Create variable

```sh
curl --data "name=source.toto.titi" http://localhost:8888/api/create
```
name of variable can be alphanumeric text [a-zA-Z0-9] or a '.' as a separator.

## Set a variable value

```sh
curl --data "name=source.toto.titi&value=11" http://localhost:8888/api/add_value
```
