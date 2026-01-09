import type { NextApiRequest, NextApiResponse } from "next"
import bcrypt from "bcryptjs"
import { serialize } from "cookie"
import { Firm } from "@/types"

const POSTGREST_BASE_URL = process.env.POSTGREST_BASE_URL

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" })
  }

  try {
    const { email, password, name, plan, whopMembershipId } = req.body

    // Validaciones
    if (!email || !password || !name || !plan) {
      return res.status(400).json({ message: "Todos los campos son requeridos" })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email inválido" })
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" })
    }

    // Crear token de sesión (mock)
    const sessionToken = Buffer.from(
      JSON.stringify({
        email,
        name,
        plan,
        whopMembershipId,
        createdAt: new Date().toISOString(),
      })
    ).toString("base64")

    // URLs PostgREST
    const firmUrl = `${POSTGREST_BASE_URL}/firms`
    const userPortalUrl = `${POSTGREST_BASE_URL}/portal_users`
    const userUrl = `${POSTGREST_BASE_URL}/users`

    // Crear firma
    const firmResponse = await fetch(firmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        whop_membership_id: whopMembershipId,
        whop_plan_id: plan,
        isActive: 1,
      }),
    })

    if (!firmResponse.ok) {
      throw new Error("Error creando firma")
    }

    const firm: Firm = await firmResponse.json()

    // Crear usuario portal
    await fetch(userPortalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password_hash: await bcrypt.hash(password, 10),
        firm_id: firm.id,
      }),
    })

    // Crear usuario admin
    await fetch(userUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        firm_id: firm.id,
        role: "admin",
        telegram_id: Date.now(),
      }),
    })

    // Set cookie (forma tradicional)
    res.setHeader(
      "Set-Cookie",
      serialize("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
    )

    return res.status(200).json({
      success: true,
      message: "Cuenta creada exitosamente",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({
      message: "Error interno del servidor",
    })
  }
}
