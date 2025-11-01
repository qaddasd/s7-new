export const social = {
  telegram: "https://t.me/s7robotics",         
  whatsapp: "https://wa.me/77760457776",      
  phone: "+77760457776",                      
  email: "support@s7robotics.space",                
  instagram: "https://instagram.com/s7.robotics", 
  vk: "https://vk.com/s7robotics",             
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
