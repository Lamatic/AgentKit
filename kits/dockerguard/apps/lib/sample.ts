// A deliberately flawed Dockerfile used by the "Load example" button so people
// can try the audit without having a file handy.
export const SAMPLE_DOCKERFILE = `FROM node:latest

ADD . /app
WORKDIR /app

ENV API_KEY=sk-live-abc123secret

RUN apt-get update
RUN apt-get install -y curl
RUN npm install

EXPOSE 3000
CMD npm start
`;
