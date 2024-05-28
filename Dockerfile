FROM node:22.2.0 as build

# Build everything as a non-root user (the default 'node' user)
USER 1000
WORKDIR /home/node

COPY --chown=1000:1000 package.json yarn.lock ./
COPY --chown=1000:1000 . .

RUN yarn --verbose install
RUN yarn --verbose build

# Uninstall dev/build dependencies
RUN yarn --verbose install --production

# Create runtime image
FROM node:22.2.0-slim

# Switch workdir - this specific directory is used in standard configurations of e.g. getting-started to mount the repository folder
WORKDIR /usr/src/app

# Create folders for case model repository and deployment
RUN mkdir ./repository && mkdir ./repository_deploy && chown -R 1000:1000 ./repository*

# Copy all runtime node modules and build result to runtime image
COPY --from=build --chown=1000:1000 /home/node/node_modules ./node_modules
COPY --from=build --chown=1000:1000 /home/node/dist ./dist

# Expose ide port and run as non-root user
EXPOSE 2081
USER 1000

# Start the IDE
CMD ["node", "dist/server/server.js" ]
