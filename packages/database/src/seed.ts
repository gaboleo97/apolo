import postgres from "postgres";
import bcrypt from "bcryptjs";

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  console.error("❌ DATABASE_URL no está definido");
  process.exit(1);
}

const DATABASE_URL: string = rawUrl;
const sql = postgres(DATABASE_URL, { prepare: false });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@apolo.app";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    console.log(`Admin ya existe: ${email}`);
    await sql.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [tenant] = await sql`
    INSERT INTO tenants (name, slug, country, plan, modules_enabled, is_active)
    VALUES ('Apolo HQ', 'apolo-hq', 'AR', 'business', ${sql.json(["inventory", "sales", "purchases", "accounting", "ai", "arca"])}, true)
    RETURNING id
  `;

  await sql`
    INSERT INTO users (tenant_id, email, password_hash, name, role, is_active)
    VALUES (${tenant.id}, ${email}, ${passwordHash}, 'Super Admin', 'super_admin', true)
  `;

  console.log(`✅ Admin creado en ${DATABASE_URL.split("@").pop()}`);
  console.log(`   email:    ${email}`);
  console.log(`   password: ${password}`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});