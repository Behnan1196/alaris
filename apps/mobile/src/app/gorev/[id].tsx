import { DOMAINS, type DomainKey } from '@alaris/shared';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { Message } from '@/components/form';
import { Screen } from '@/components/screen';
import { MealDay } from '@/components/tasks/meal-day';
import { MeasureEntry } from '@/components/tasks/measure-entry';
import { WorkoutFlow } from '@/components/tasks/workout-flow';
import { useAuth } from '@/lib/auth';
import { findInstance, loadProgramTask, type Instance, type ProgramTask } from '@/lib/tasks';

export default function GorevScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [task, setTask] = useState<ProgramTask | null>(null);
  const [instance, setInstance] = useState<Instance | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([loadProgramTask(id), findInstance(id)])
      .then(([t, i]) => {
        setTask(t);
        setInstance(i);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (!session) return <Redirect href="/giris" />;

  const color = DOMAINS[task?.program?.domain_key as DomainKey]?.color ?? '#18181B';
  const header = (
    <Stack.Screen
      options={{
        title: task?.title ?? '',
        headerShown: true,
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: color },
      }}
    />
  );

  if (error)
    return (
      <Screen>
        {header}
        <Message kind="error" text={error} />
      </Screen>
    );
  if (!task || instance === undefined)
    return (
      <Screen>
        {header}
        <ActivityIndicator />
      </Screen>
    );

  const props = { task, instance, color };
  return (
    <>
      {header}
      {task.task_type_key === 'workout' && <WorkoutFlow {...props} />}
      {task.task_type_key === 'meal' && <MealDay {...props} />}
      {task.task_type_key === 'measure' && <MeasureEntry {...props} clientId={session.user.id} />}
    </>
  );
}
