export const config = {
  matcher: '/:path*',
};

export default function middleware(request: Request) {
  const basicAuth = request.headers.get('authorization');

  // Basic認証の認証情報
  const authUser = 'kennet';
  const authPassword = 'kennet2025';

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === authUser && pwd === authPassword) {
      return;
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

