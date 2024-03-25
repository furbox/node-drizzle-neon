import { FastifyReply, FastifyRequest } from "fastify";
import { createApplicationBody } from "./applications.schemas";
import { createApplication, getApplications } from "./applications.services";
import { createRole } from "../roles/roles.services";
import {
  ALL_PERMISSIONS,
  SYSTEM_ROLE,
  USER_ROLE_PERMISSIONS,
} from "../../config/permissions";

export async function createApplicationHandler(
  request: FastifyRequest<{
    Body: createApplicationBody;
  }>,
  reply: FastifyReply
) {
  const { name } = request.body;
  const application = await createApplication({
    name,
  });

  const superAdminRolePromise = await createRole({
    name: SYSTEM_ROLE.SUPER_ADMIN,
    applicationId: application.id,
    permissions: ALL_PERMISSIONS as unknown as Array<string>,
  });

  const applicationUserRolePromise = await createRole({
    name: SYSTEM_ROLE.APPLICATION_USER,
    applicationId: application.id,
    permissions: USER_ROLE_PERMISSIONS,
  });

  const [superAdminRole, applicationUserRole] = await Promise.allSettled([
    superAdminRolePromise,
    applicationUserRolePromise,
  ]);

  if (superAdminRole.status === "rejected") {
    throw new Error(`Error creating super admin role`);
  }

  if (applicationUserRole.status === "rejected") {
    throw new Error(`Error creating application user role`);
  }

  return {
    application,
    superAdminRole: superAdminRole.value,
    applicationUserRole: applicationUserRole.value,
  };
}

export async function getApplicationsHandler(){
    return getApplications();
}