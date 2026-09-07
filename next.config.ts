import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Désactivé en dev pour éviter tout conflit local
});

const nextConfig = {};

export default withPWA(nextConfig);