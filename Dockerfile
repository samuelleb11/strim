FROM node:14
RUN apt-get update -y && \
  apt-get upgrade -y --force-yes && \
  apt-get install -y --force-yes supervisor && \
  mkdir /strim
COPY . /strim
RUN cd /strim && \
  cp /strim/dockerfiles/supervisord.conf /etc/supervisor/conf.d/supervisord.conf && \
  npm install
ENTRYPOINT []
CMD supervisord -c /etc/supervisor/conf.d/supervisord.conf
EXPOSE 3181