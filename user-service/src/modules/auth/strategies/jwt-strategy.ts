import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import { users } from "../../../core/database/schemas/schema.js";
import db from "../../../core/database/index.js";
import { eq } from "drizzle-orm";

// Verify JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
};

passport.use(
  new JwtStrategy(
    opts,
    async (
      jwt_payload: { id: number },
      done: (error: any, user?: any) => void
    ) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, jwt_payload.id))
          .limit(1);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

export default passport;
