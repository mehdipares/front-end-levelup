// src/validation/schemas.js
import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("Email invalide")
    .required("Email requis"),
  password: yup
    .string()
    .required("Mot de passe requis"),
});

export const registerSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("Email invalide")
    .required("Email requis"),
  username: yup
    .string()
    .trim()
    .min(3, "Pseudo : 3 caractères minimum")
    .max(40, "Pseudo : 40 caractères maximum")
    .required("Pseudo requis"),
  password: yup
    .string()
    .min(8, "Mot de passe : 8 caractères minimum")
    .required("Mot de passe requis"),
});

export const customGoalSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, "Titre : 3 caractères minimum")
    .max(80, "Titre : 80 caractères maximum")
    .required("Titre requis"),
  description: yup
    .string()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null))
    .max(500, "Description : 500 caractères maximum"),
  category_id: yup
    .number()
    .nullable()
    .transform((v, orig) => (orig === "" || orig == null ? null : Number(orig))),
  base_xp: yup
    .number()
    .typeError("XP : doit être un nombre")
    .integer("XP : doit être un entier")
    .min(1, "XP : minimum 1")
    .max(1000, "XP : maximum 1000")
    .required("XP requis"),
  frequency_type: yup
    .mixed()
    .oneOf(["daily", "weekly"], "Fréquence invalide")
    .required("Fréquence requise"),
  frequency_interval: yup
    .number()
    .typeError("Intervalle : doit être un nombre")
    .integer("Intervalle : doit être un entier")
    .min(1, "Intervalle : minimum 1")
    .max(365, "Intervalle : maximum 365")
    .required(),
  max_per_period: yup
    .number()
    .typeError("Max/période : doit être un nombre")
    .integer("Max/période : doit être un entier")
    .min(1, "Max/période : minimum 1")
    .max(99, "Max/période : maximum 99")
    .required(),
});

export const profileSchema = yup.object({
  username: yup
    .string()
    .trim()
    .min(3, "Pseudo : 3 caractères minimum")
    .max(40, "Pseudo : 40 caractères maximum")
    .nullable(),
  email: yup
    .string()
    .trim()
    .email("Email invalide")
    .required("Email requis"),
});
