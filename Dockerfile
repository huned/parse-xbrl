FROM node:14

RUN apt-get update && apt-get install -y vim

RUN wget https://raw.githubusercontent.com/nikensss/dotfiles/main/install.sh -O $HOME/install.sh && sh $HOME/install.sh
