import fastify from "fastify";
import guard from "fastify-guard";
import { logger } from "./logger";
import { applicationsRoutes } from "../modules/applications/applications.routes";
import { userRoutes } from "../modules/users/users.routes";
import { roleRoutes } from "../modules/roles/roles.routes";
import jwt from 'jsonwebtoken';

type User = {
  id: string,
  applicationId: string,
  scopes: Array<string>
}

declare module 'fastify'{
  interface FastifyRequest {
    user: User
  }
}

export function buildServer() {
  const app = fastify({ logger });

  app.addHook('onRequest', async function(request, reply) {
      const authHeader = request.headers.authorization;

      if(!authHeader) {
        return;
      }

      try {
        const token = authHeader.replace('Bearer ', '').trim();
        const decoded = jwt.verify(token, 'secret') as User;
        request.user = decoded;
      } catch (error) {
        
      }
  })

  //register plugins
  app.register(guard, {
    requestProperty: 'user',
    scopeProperty: "scopes",
    errorHandler: (result, request, reply) => {
      return reply.send("Unauthorized");
    }
  });

  //register routes
  app.register(applicationsRoutes, { prefix: "/api/applications" });
  app.register(userRoutes, { prefix: "/api/users" });
  app.register(roleRoutes, { prefix: "/api/roles"});
  
  return app;
}
