import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { User } from '../../models/user';
import { getErrorMessage } from '../../utils/error-message';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
})
export class AdminDashboardPage implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly searchTerm = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly hasMore = signal(false);

  get searchTermValue(): string {
    return this.searchTerm();
  }

  set searchTermValue(value: string) {
    this.searchTerm.set(value);
  }

  async ngOnInit(): Promise<void> {
    await this.loadUsers(true);
  }

  async loadUsers(reset = false): Promise<void> {
    if (this.loading() || this.loadingMore()) {
      return;
    }

    if (reset) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    const skip = reset ? 0 : this.users().length;

    try {
      const response = await firstValueFrom(
        this.adminService.listUsers({
          skip,
          limit: PAGE_SIZE,
          search: this.searchTerm().trim() || undefined,
        }),
      );
      const items = response.items ?? [];
      this.hasMore.set(items.length === PAGE_SIZE);
      if (reset) {
        this.users.set(items);
      } else {
        this.users.update((prev) => [...prev, ...items]);
      }
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült betölteni a felhasználókat.'));
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  async toggleSuspension(user: User): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.adminService.setSuspension(user._id, !user.isSuspended),
      );
      this.users.update((prev) =>
        prev.map((item) => (item._id === user._id ? response.user : item)),
      );
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült frissíteni az állapotot.'));
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await firstValueFrom(this.adminService.deleteUser(userId));
      this.users.update((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error, 'Nem sikerült törölni a felhasználót.'));
    }
  }

  async onSearch(): Promise<void> {
    await this.loadUsers(true);
  }
}
