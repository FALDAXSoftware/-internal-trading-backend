#!/bin/bash

SERVICE_NAME=$1

SERVICES_DIR=/opt/$USER/services
BUILDS_DIR=/opt/$USER/builds
LOGS_DIR=/var/log/$USER

sudo mkdir -p $SERVICES_DIR $BUILDS_DIR $LOGS_DIR/$SERVICE_NAME

sudo chown -R $USER:$USER $SERVICES_DIR
sudo chown -R $USER:$USER $BUILDS_DIR
sudo chown -R $USER:$USER $LOGS_DIR

mkdir -p /opt/$USER/builds/$SERVICE_NAME
mkdir -p /home/$USER/.tmp/builds/$SERVICE_NAME