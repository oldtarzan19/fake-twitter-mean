import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = await auth.ensureAuthenticated();
  if (user) {
    return router.parseUrl('/');
  }

  return true;
};
