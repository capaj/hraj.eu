import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import { getCoreGroups } from '~/server-functions/getCoreGroups'
import { getUsers } from '~/server-functions/getUsers'
import { createCoreGroup } from '~/server-functions/createCoreGroup'
import { updateCoreGroup } from '~/server-functions/updateCoreGroup'
import { deleteCoreGroup } from '~/server-functions/deleteCoreGroup'
import { User } from '../types'
import { Edit, Plus, Save, Trash2, Users } from 'lucide-react'

type EditableGroup = {
  id?: string
  name: string
  userIds: string[]
}

export const ManageCoreGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Array<{ id: string; name: string; userIds: string[] }>>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editor, setEditor] = useState<EditableGroup | null>(null)

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u.name || u.email])),
    [users]
  )

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [groupData, usersData] = await Promise.all([getCoreGroups(), getUsers()])
      setGroups(groupData)
      setUsers(usersData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const startCreate = () => {
    setEditor({ name: '', userIds: [] })
  }

  const startEdit = (group: { id: string; name: string; userIds: string[] }) => {
    setEditor({ id: group.id, name: group.name, userIds: [...group.userIds] })
  }

  const saveGroup = async () => {
    if (!editor) return

    if (!editor.name.trim()) {
      alert(i18n._(msg`Please provide a group name.`))
      return
    }

    if (editor.userIds.length === 0) {
      alert(i18n._(msg`Please select at least one member.`))
      return
    }

    if (editor.id) {
      await updateCoreGroup({
        data: { id: editor.id, name: editor.name.trim(), userIds: editor.userIds }
      })
    } else {
      await createCoreGroup({
        data: { name: editor.name.trim(), userIds: editor.userIds }
      })
    }

    setEditor(null)
    await loadData()
  }

  const removeGroup = async (id: string) => {
    if (!confirm(i18n._(msg`Delete this core group?`))) {
      return
    }

    await deleteCoreGroup({ data: { id } })
    await loadData()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900"><Trans>Manage Core Groups</Trans></h1>
                <p className="text-gray-600 mt-1">
                  <Trans>Create and edit reusable groups for early event access.</Trans>
                </p>
              </div>
              <Button type="button" onClick={startCreate}>
                <Plus size={16} className="mr-2" />
                <Trans>New Group</Trans>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {editor && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                {editor.id ? <Trans>Edit Group</Trans> : <Trans>Create Group</Trans>}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Trans>Group name</Trans>
                </label>
                <input
                  type="text"
                  value={editor.name}
                  onChange={(e) => setEditor((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Trans>Members</Trans>
                </label>
                <select
                  multiple
                  value={editor.userIds}
                  onChange={(e) =>
                    setEditor((prev) =>
                      prev
                        ? {
                            ...prev,
                            userIds: Array.from(e.target.selectedOptions).map((option) => option.value)
                          }
                        : prev
                    )
                  }
                  className="w-full min-h-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button type="button" onClick={saveGroup}>
                  <Save size={16} className="mr-2" />
                  <Trans>Save</Trans>
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditor(null)}>
                  <Trans>Cancel</Trans>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900"><Trans>Your Groups</Trans></h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600"><Trans>Loading...</Trans></p>
            ) : groups.length === 0 ? (
              <p className="text-gray-600"><Trans>No groups yet. Create your first one.</Trans></p>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <Users size={14} /> {group.userIds.length}
                          <Trans>members</Trans>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {group.userIds.map((userId) => userMap.get(userId) || userId).join(', ')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(group)}>
                          <Edit size={14} className="mr-1" />
                          <Trans>Edit</Trans>
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => removeGroup(group.id)}>
                          <Trash2 size={14} className="mr-1" />
                          <Trans>Delete</Trans>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
