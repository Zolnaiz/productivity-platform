import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { productivityService } from '../services/productivity.service';
import { Badge } from '../types/productivity.types';

const BadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    productivityService.getBadges().then(setBadges);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Badges</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ажил, audit, focus, consistency дээр суурилсан recognition.
        </p>
      </div>

      {badges.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {badges.map((badge) => (
            <Card key={badge.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{badge.title}</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{badge.description}</p>
                </div>
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-xs ${
                    badge.earned ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {badge.earned ? 'Earned' : 'Locked'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No badges configured"
          description="Recognition badges for consistency, quality, audit completion, and focus streaks will appear here."
        />
      )}
    </div>
  );
};

export default BadgesPage;
