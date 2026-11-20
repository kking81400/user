/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '3000',
                pathname: '**', // اجازه دادن به تمام مسیرها روی این هاست و پورت
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '**',
            },
        ],
    },
};

export default nextConfig;