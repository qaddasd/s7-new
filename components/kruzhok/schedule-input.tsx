"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

interface ScheduleEntry {
  day: string
  time: string
}

interface ScheduleInputProps {
  schedule: ScheduleEntry[]
  onChange: (schedule: ScheduleEntry[]) => void
}

const daysOfWeek = [
  { value: "Mon", label: "Понедельник" },
  { value: "Tue", label: "Вторник" },
  { value: "Wed", label: "Среда" },
  { value: "Thu", label: "Четверг" },
  { value: "Fri", label: "Пятница" },
  { value: "Sat", label: "Суббота" },
  { value: "Sun", label: "Воскресенье" },
]

export default function ScheduleInput({ schedule, onChange }: ScheduleInputProps) {
  const [newEntry, setNewEntry] = useState<ScheduleEntry>({ day: "", time: "" })

  const handleAdd = () => {
    if (newEntry.day && newEntry.time) {
      onChange([...schedule, newEntry])
      setNewEntry({ day: "", time: "" })
    }
  }

  const handleRemove = (index: number) => {
    onChange(schedule.filter((_, i) => i !== index))
  }

  const handleTimeChange = (index: number, time: string) => {
    const newSchedule = [...schedule]
    newSchedule[index].time = time
    onChange(newSchedule)
  }

  const handleDayChange = (index: number, day: string) => {
    const newSchedule = [...schedule]
    newSchedule[index].day = day
    onChange(newSchedule)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {schedule.map((entry, index) => (
          <div key={index} className="flex space-x-2 items-center">
            <Select
              value={entry.day}
              onValueChange={(day) => handleDayChange(index, day)}
            >
              <SelectTrigger className="w-[150px] bg-[#1e1e26] border-[#636370]/20 text-white">
                <SelectValue placeholder="День" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e26] border-[#636370]/20 text-white">
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="time"
              value={entry.time}
              onChange={(e) => handleTimeChange(index, e.target.value)}
              className="w-[100px] bg-[#1e1e26] border-[#636370]/20 text-white"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              className="text-[#ef4444] hover:text-[#dc2626]"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex space-x-2 items-center border-t border-[#636370]/20 pt-4">
        <Select
          value={newEntry.day}
          onValueChange={(day) => setNewEntry({ ...newEntry, day })}
        >
          <SelectTrigger className="w-[150px] bg-[#1e1e26] border-[#636370]/20 text-white">
            <SelectValue placeholder="День" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e1e26] border-[#636370]/20 text-white">
            {daysOfWeek.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="time"
          value={newEntry.time}
          onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
          className="w-[100px] bg-[#1e1e26] border-[#636370]/20 text-white"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!newEntry.day || !newEntry.time}
          className="bg-[#22c55e] text-black hover:bg-[#16a34a]"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
