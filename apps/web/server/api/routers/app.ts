import { env } from "@/lib/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Resend } from "resend";
import { isResendEmailUnsubscribed } from "@workspace-cloud/core";
import { z } from "zod/v3";

/**
 * This router is used to handle application-level operations, mostly internal stuff
 */
export const appRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      if (!env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not set");
      }

      const resend = new Resend(env.RESEND_API_KEY);

      // If available, block emails to unsubscribed contacts (best‑effort)
      if (env.RESEND_AUDIENCE_ID) {
        try {
          const unsubscribed = await isResendEmailUnsubscribed(
            resend.contacts,
            env.RESEND_AUDIENCE_ID,
            input.email,
          );
          if (unsubscribed) {
            // Avoid email enumeration: add a small jitter and return a neutral response while skipping the send
            await new Promise((r) => setTimeout(r, 200 + Math.random() * 400));
            return { success: true };
          }
        } catch {
          // proceed if we cannot determine
        }
      }

      const data = await resend.emails.send({
        from: "Genui AI <magan@genui.co>",
        to: input.email,
        subject: "Welcome to Genui AI Early Access",
        html: `
          <h1>Welcome to Genui AI!</h1>
          <p>Thanks for joining our early access list. We'll keep you updated on our latest developments.</p>
          <p>Best,<br>The Genui AI Team</p>
        `,
      });

      return { success: true, data };
    }),
});
