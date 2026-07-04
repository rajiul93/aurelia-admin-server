import { withErrorHandler } from "@/lib/api/handler";
import { userController } from "@/modules/user";

export const GET = withErrorHandler((req) => userController.list(req));
export const POST = withErrorHandler((req) => userController.create(req));
