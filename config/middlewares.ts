export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', '*.digitaloceanspaces.com', '*.mapdino.com', '*.appikot.com'],
          'media-src': ["'self'", 'data:', 'blob:', '*.digitaloceanspaces.com', '*.mapdino.com', '*.appikot.com'],
          // If using a CDN, add it too:
          // 'img-src': [..., 'cdn.example.com'],
          // 'media-src': [..., 'cdn.example.com'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
