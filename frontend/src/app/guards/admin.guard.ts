import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = await auth.ensureAuthenticated();
  if (user && user.role === 'admin') {
    return true;
  }

  return router.parseUrl('/');
};
