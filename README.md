# Dino Backend

A Strapi 5 backend for the Dino project, providing a flexible API and admin panel for content management, shop, office, and site features.

## Project Purpose

This project powers the backend for Dino, supporting:
- **Content feeds** (news, updates, etc.)
- **Shop and shop menu** (products, categories, addresses)
- **Office information** (locations, details)
- **Site-wide configuration**
- **Custom image upload logic** (all images converted to WebP, cropped/resized, with robust extension logic)

## Main Features
- Built with Strapi 5 (Node.js, TypeScript)
- Modular API structure: `/src/api/{feature}` for feed, shop, office, shop-menu, site
- Custom upload extension: `/src/extensions/upload/strapi-server.ts` overrides image manipulation for advanced processing
- Global components for shared data (operation info, shop address)
- Type definitions for generated content types

## Folder Structure
- `src/api/` — Feature APIs (feed, office, shop, shop-menu, site)
- `src/components/global/` — Shared JSON components
- `src/extensions/upload/` — Custom upload logic
- `types/generated/` — TypeScript types for content

## Getting Started

### Development
Start the Strapi backend in development mode:
```powershell
npm run develop
```
Or with yarn:
```powershell
yarn develop
```

### Build Admin Panel
```powershell
npm run build
```
Or:
```powershell
yarn build
```

### Start Production
```powershell
npm run start
```
Or:
```powershell
yarn start
```

## Troubleshooting
- **Image upload issues:** See `src/extensions/upload/strapi-server.ts` for custom logic and console logs.
- **Database/config errors:** Check `config/database.ts` and `config/plugins.ts`.
- **Type errors:** Regenerate types in `types/generated/` if needed.
- **General Strapi issues:** Refer to [Strapi documentation](https://docs.strapi.io).

## Resources
- [Strapi Documentation](https://docs.strapi.io)
- [Strapi Tutorials](https://strapi.io/tutorials)
- [Strapi Community](https://discord.strapi.io)

---
<sub>Project maintained by efendy. Contributions welcome!</sub>
