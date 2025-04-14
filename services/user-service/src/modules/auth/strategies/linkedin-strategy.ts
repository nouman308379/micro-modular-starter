// strategies/linkedin-strategy.ts
import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { users } from "../../../core/database/schemas/schema.js";
import db from "../../../core/database/index.js";
import { eq } from "drizzle-orm";

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
      callbackURL: "http://localhost:8000/api/v1/auth/linkedin/callback",
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(accessToken, refreshToken);
        // Check if the user already exists in your database
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.linkedinId, profile.id))
          .limit(1);

        if (user) {
          // If the user exists, return the user
          return done(null, user);
        } else {
          // If the user doesn't exist, create a new user
          const [newUser] = await db
            .insert(users)
            .values({
              linkedinId: profile.id,
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