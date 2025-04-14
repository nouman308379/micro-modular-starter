import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { users } from "../../../core/database/schemas/schema.js";
import db from "../../../core/database/index.js";
import { eq } from "drizzle-orm";

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user.id);
});

passport.deserializeUser(
  async (id: number, done: (err: any, user?: any) => void) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "http://localhost:8000/api/v1/auth/google/callback",
      //  passReqToCallback: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(accessToken, refreshToken);
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.googleId, profile.id))
          .limit(1);

        if (user) {
          // If the user exists, return the user
          return done(null, user);
        } else {
          // If the user doesn't exist, create a new user
          const [newUser] = await db
            .insert(users)
            .values({
              googleId: profile.id,
              email: profile.emails?.[0].value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
            })
            .returning();

          return done(null, newUser);
        }
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
