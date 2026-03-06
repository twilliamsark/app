import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { StorageService } from './services/storage.service';
import { CsvService } from './services/csv.service';

const INITIAL_LOAD_TIMEOUT_MS = 5000;

export function loadInitialData(): Promise<unknown> {
  const storage = inject(StorageService);
  const http = inject(HttpClient);
  const csv = inject(CsvService);
  const fetchPromise = firstValueFrom(
    http.get('jonesboro_nutrition.csv', { responseType: 'text' })
  ).then((text) => {
    if (text && storage.foods().length === 0) {
      storage.mergeFoods(csv.parseFoodCsv(text));
    }
  });
  const timeoutPromise = new Promise<void>((resolve) =>
    setTimeout(resolve, INITIAL_LOAD_TIMEOUT_MS)
  );
  return Promise.race([fetchPromise, timeoutPromise]).catch(() => undefined);
}
