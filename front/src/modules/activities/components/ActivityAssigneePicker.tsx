import { useApolloClient } from '@apollo/client';
import { getOperationName } from '@apollo/client/utilities';

import { useFilteredSearchEntityQuery } from '@/search/hooks/useFilteredSearchEntityQuery';
import { SingleEntitySelect } from '@/ui/input/relation-picker/components/SingleEntitySelect';
import { relationPickerSearchFilterScopedState } from '@/ui/input/relation-picker/states/relationPickerSearchFilterScopedState';
import { EntityForSelect } from '@/ui/input/relation-picker/types/EntityForSelect';
import { Entity } from '@/ui/input/relation-picker/types/EntityTypeForSelect';
import { useRecoilScopedState } from '@/ui/utilities/recoil-scope/hooks/useRecoilScopedState';
import {
  Activity,
  useGetWorkspaceMembersLazyQuery,
  User,
  useSearchUserQuery,
  useUpdateActivityMutation,
} from '~/generated/graphql';

import { ACTIVITY_UPDATE_FRAGMENT } from '../graphql/fragments/activityUpdateFragment';
import { GET_ACTIVITIES } from '../graphql/queries/getActivities';

export type ActivityAssigneePickerProps = {
  activity: Pick<Activity, 'id'> & {
    accountOwner?: Pick<User, 'id' | 'displayName'> | null;
  };
  onSubmit?: () => void;
  onCancel?: () => void;
};

type UserForSelect = EntityForSelect & {
  entityType: Entity.User;
};

export const ActivityAssigneePicker = ({
  activity,
  onSubmit,
  onCancel,
}: ActivityAssigneePickerProps) => {
  const [relationPickerSearchFilter] = useRecoilScopedState(
    relationPickerSearchFilterScopedState,
  );
  const [updateActivity] = useUpdateActivityMutation();
  const [getWorkspaceMember] = useGetWorkspaceMembersLazyQuery();

  const users = useFilteredSearchEntityQuery({
    queryHook: useSearchUserQuery,
    filters: [
      {
        fieldNames: ['firstName', 'lastName'],
        filter: relationPickerSearchFilter,
      },
    ],
    orderByField: 'firstName',
    mappingFunction: (user) => ({
      entityType: Entity.User,
      id: user.id,
      name: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarType: 'rounded',
      avatarUrl: user.avatarUrl ?? '',
      originalEntity: user,
    }),
    selectedIds: activity?.accountOwner?.id ? [activity?.accountOwner?.id] : [],
  });

  const client = useApolloClient();
  const cachedActivity = client.readFragment({
    id: `Activity:${activity.id}`,
    fragment: ACTIVITY_UPDATE_FRAGMENT,
  });

  const handleEntitySelected = async (
    selectedUser: UserForSelect | null | undefined,
  ) => {
    if (selectedUser) {
      const assignee = (
        await getWorkspaceMember({
          variables: {
            where: {
              userId: { equals: selectedUser.id },
            },
          },
        })
      ).data?.workspaceMembers?.[0];

      updateActivity({
        variables: {
          where: { id: activity.id },
          data: {
            assignee: {
              connect: { id: assignee?.id },
            },
          },
        },
        optimisticResponse: {
          __typename: 'Mutation',
          updateOneActivity: {
            ...cachedActivity,
            assignee: {
              __typename: 'User',
              ...selectedUser,
              displayName: selectedUser.name,
            },
          },
        },
        refetchQueries: [getOperationName(GET_ACTIVITIES) ?? ''],
      });
    }

    onSubmit?.();
  };

  return (
    <SingleEntitySelect
      entitiesToSelect={users.entitiesToSelect}
      loading={users.loading}
      onCancel={onCancel}
      onEntitySelected={handleEntitySelected}
      selectedEntity={users.selectedEntities[0]}
    />
  );
};
