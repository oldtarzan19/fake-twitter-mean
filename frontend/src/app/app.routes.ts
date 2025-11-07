import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { guestGuard } from './guards/guest.guard';
import { AuthPage } from './pages/auth/auth.page';
import { FeedPage } from './pages/feed/feed.page';
import { TweetDetailPage } from './pages/tweet-detail/tweet-detail.page';
import { ProfilePage } from './pages/profile/profile.page';
import { AdminDashboardPage } from './pages/admin/admin-dashboard.page';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    component: AuthPage,
  },
  {
    path: '',
    canActivate: [authGuard],
    component: FeedPage,
  },
  {
    path: 'tweet/:id',
    canActivate: [authGuard],
    component: TweetDetailPage,
  },
  {
    path: 'profile/:id',
    canActivate: [authGuard],
    component: ProfilePage,
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    component: AdminDashboardPage,
  },
  { path: '**', redirectTo: '' },
];
