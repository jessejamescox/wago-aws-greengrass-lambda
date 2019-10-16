FROM arm32v7/node:8.10.0-slim
LABEL maintainer = Wago <jesse.cox@wago.com>


# Set ENV_VAR for Greengrass RC to be untarred inside Docker Image
ARG greengrass_version=1.9.3
ARG GREENGRASS_RELEASE_URL=https://d1onfpft10uf5o.cloudfront.net/greengrass-core/downloads/${greengrass_version}/greengrass-linux-armv7l-${greengrass_version}.tar.gz

COPY resources / 

# Insert your own interception certificate for operation behind a corporate firewall
# COPY <yourCertificate.cer> /usr/local/share/ca-certificates/<yourCertificate.cer>

# Install Greengrass Core Dependencies
RUN apt-get update && \
   apt-get install -y tar gzip wget xz-utils libc6 ca-certificates iproute2 python git unzip && \
   wget $GREENGRASS_RELEASE_URL

WORKDIR / 

# Copy Greengrass Licenses AWS IoT Greengrass Docker Image
COPY greengrass-license-v1.pdf /

# Copy start-up script
COPY "greengrass-entrypoint.sh" /
RUN chmod +x /greengrass-entrypoint.sh

# Setup Greengrass inside Docker Image
RUN export GREENGRASS_RELEASE=$(basename $GREENGRASS_RELEASE_URL) && \
   tar xzf $GREENGRASS_RELEASE -C / && \
   rm $GREENGRASS_RELEASE && \
   useradd -r ggc_user && \
   groupadd -r ggc_group

WORKDIR /greengrass/ggc/packages/1.9.3/runtime/nodejs/node_modules

RUN npm i node-opcua@0.0.65
RUN npm i ethernet-ip
RUN npm i aws-sdk

WORKDIR /

# change name of node executable for Lambda compatibility and link it back to itself
RUN mv /usr/local/bin/node /usr/local//bin/nodejs8.10
RUN ln -s /usr/local/bin/nodejs8.10 /usr/local/bin/node

# remove unnecessary applications
RUN apt-get remove --purge -y unzip git wget gzip tar && \
	rm -rf /var/lib/apt/lists/* 

RUN chmod -R 777 /greengrass/ggc/packages/1.9.3/runtime/nodejs/node_modules

# Expose 8883 to pub/sub MQTT messages
EXPOSE 8883

ENTRYPOINT [ "/greengrass-entrypoint.sh" ]