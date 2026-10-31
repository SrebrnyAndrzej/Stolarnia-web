import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export type Role = "owner" | "employee" | "client";
export interface Membership {
  user_id: string;
  role: Role;
  active: boolean;
  project_ids: string[];
  display_name: string;
}
export interface Principal extends Membership {
  email: string;
}
const membershipSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "employee", "client"]),
  active: z.boolean(),
  project_ids: z.array(z.string()),
  display_name: z.string(),
});
const COOKIE = "pan_stolarz_session";
export class AccessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const mayReadProject = (person: Membership, id: string) =>
  person.active && (person.role === "owner" || person.project_ids.includes(id));
export function cookieToken(req: Request): string | undefined {
  const bearer = req.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7);
  const cookie = req
    .get("cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE}=`));
  return cookie?.slice(COOKIE.length + 1);
}

export function createAccess(env = process.env) {
  const url = env.SUPABASE_URL;
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY;
  const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
  const admin = url && secret ? createClient(url, secret, options) : null;
  const configured = !!(url && publicKey && admin);
  const getAuth = () => {
    if (!configured)
      throw new AccessError(
        503,
        "Logowanie nie zostało jeszcze uruchomione. Skontaktuj się z właścicielem stolarni.",
      );
    // A new client per operation prevents sessions being shared between requests.
    return createClient(url!, publicKey!, options);
  };
  const membership = async (id: string): Promise<Membership> => {
    if (!admin) throw new AccessError(503, "Usługa kont jest niedostępna.");
    const { data, error } = await admin
      .from("pan_stolarz_members")
      .select("user_id,role,active,project_ids,display_name")
      .eq("user_id", id)
      .maybeSingle();
    if (error)
      throw new AccessError(
        503,
        "Nie udało się sprawdzić dostępu. Spróbuj ponownie.",
      );
    const parsed = membershipSchema.safeParse(data);
    if (!parsed.success || !parsed.data.active)
      throw new AccessError(
        403,
        "Konto nie ma aktywnego dostępu do Pan Stolarz.",
      );
    return parsed.data;
  };
  const identify = async (req: Request): Promise<Principal> => {
    const token = cookieToken(req);
    if (!token) throw new AccessError(401, "Zaloguj się, aby kontynuować.");
    const { data, error } = await getAuth().auth.getUser(token);
    if (error || !data.user)
      throw new AccessError(401, "Sesja wygasła. Zaloguj się ponownie.");
    return {
      ...(await membership(data.user.id)),
      email: data.user.email ?? "",
    };
  };
  const checkOrigin = (req: Request) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
    // Bearer credentials are not ambient browser credentials (MCP/CLI).
    if (req.get("authorization")?.startsWith("Bearer ")) return;
    const origin = req.get("origin");
    let allowed: boolean = false;
    try {
      const expected = env.PAN_STOLARZ_ORIGIN
        ? new URL(env.PAN_STOLARZ_ORIGIN).origin
        : `${req.protocol}://${req.get("host")}`;
      allowed = !!origin && new URL(origin).origin === expected;
    } catch {
      /* deny malformed origins */
    }
    if (!allowed)
      throw new AccessError(403, "Żądanie pochodzi z niedozwolonego adresu.");
  };
  const fail = (res: Response, error: unknown) => {
    const e =
      error instanceof AccessError
        ? error
        : new AccessError(503, "Usługa dostępu jest chwilowo niedostępna.");
    res.status(e.status).json({ blad: e.message });
  };
  const guard = async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "private, no-store");
    try {
      checkOrigin(req);
      const person = await identify(req);
      res.locals.person = person;
      // Mounted under /api or /mcp, so req.path is relative to that mount.
      const technicalCalculator =
        req.method === "GET" &&
        ["/systemy-szuflad", "/przelicznik-szuflad"].includes(req.path);
      const scopedV2 = req.path.startsWith("/v2/");
      if (
        person.role !== "owner" &&
        !(scopedV2 || (person.role === "employee" && technicalCalculator))
      ) {
        throw new AccessError(403, "Nie masz dostępu do tej funkcji.");
      }
      next();
    } catch (error) {
      fail(res, error);
    }
  };
  const login = async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      checkOrigin(req);
      const parsed = z
        .object({
          email: z.string().email().max(254),
          password: z.string().min(1).max(256),
        })
        .safeParse(req.body);
      if (!parsed.success)
        throw new AccessError(400, "Wpisz poprawny adres e-mail i hasło.");
      const auth = getAuth();
      const { data, error } = await auth.auth.signInWithPassword(parsed.data);
      if (error || !data.session || !data.user)
        throw new AccessError(
          401,
          "Nie udało się zalogować. Sprawdź e-mail i hasło.",
        );
      const member = await membership(data.user.id);
      res.cookie(COOKIE, data.session.access_token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production" || !!env.VERCEL,
        sameSite: "strict",
        path: "/",
        maxAge: data.session.expires_in * 1000,
      });
      res.json({ ...member, email: data.user.email ?? "" });
    } catch (error) {
      fail(res, error);
    }
  };
  const logout = async (req: Request, res: Response) => {
    try {
      checkOrigin(req);
      const token = cookieToken(req);
      // Revokes refresh tokens as well as removing this browser's cookie.
      if (token && admin) await admin.auth.admin.signOut(token, "local");
      res.clearCookie(COOKIE, {
        path: "/",
        httpOnly: true,
        secure: env.NODE_ENV === "production" || !!env.VERCEL,
        sameSite: "strict",
      });
      res.setHeader("Cache-Control", "no-store");
      res.json({ ok: true });
    } catch (error) {
      fail(res, error);
    }
  };
  return {
    configured,
    admin,
    identify,
    guard,
    login,
    logout,
    checkOrigin,
    fail,
  };
}
