export const social = {
  telegram: "https://t.me/s7robotics",         // e.g. https://t.me/<username>
  whatsapp: "https://wa.me/77760457776",      // use digits-only for wa.me
  phone: "+77760457776",                      // human-readable phone, used for tel:
  email: "info@s7robotics.kz",                 // email address
  instagram: "https://instagram.com/s7robotics", // optional
  vk: "https://vk.com/s7robotics",             // optional
}

export function linkFor(type: keyof typeof social): string {
  switch (type) {
    case "telegram":
      return social.telegram
    case "whatsapp":
      return social.whatsapp
    case "email":
      return `mailto:${social.email}`
    case "phone":
      return `tel:${social.phone.replace(/\s+/g, '')}`
    case "instagram":
      return social.instagram
    case "vk":
      return social.vk
    default:
      return "#"
  }
}
