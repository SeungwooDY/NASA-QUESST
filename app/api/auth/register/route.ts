import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FAKE_DOMAIN } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || username.length < 3 || username.length > 20) {
    return NextResponse.json(
      { error: "Username must be 3–20 characters" },
      { status: 400 }
    );
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username may only contain letters, numbers, and underscores" },
      { status: 400 }
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Admin client auto-confirms the user — no email verification needed
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin.auth.admin.createUser({
    email: `${username.toLowerCase()}@${FAKE_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) {
    const msg = error.message.includes("already been registered")
      ? "Username already taken"
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await admin.from("profiles").insert({ id: data.user.id, username });

  return NextResponse.json({ ok: true });
}
