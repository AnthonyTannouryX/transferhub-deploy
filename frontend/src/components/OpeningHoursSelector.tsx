import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Plus, Trash2 } from "lucide-react";

export interface OpeningHours {
  [key: string]: {
    isOpen: boolean;
    hours: Array<{
      open: string;
      close: string;
    }>;
  };
}

interface OpeningHoursSelectorProps {
  value?: OpeningHours;
  onChange: (hours: OpeningHours) => void;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const TIME_OPTIONS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
];

export default function OpeningHoursSelector({ value, onChange }: OpeningHoursSelectorProps) {
  const [openingHours, setOpeningHours] = useState<OpeningHours>(value || {
    monday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    tuesday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    wednesday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    thursday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    friday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    saturday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    sunday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
  });

  const updateDay = (day: string, updates: Partial<OpeningHours[string]>) => {
    const newHours = {
      ...openingHours,
      [day]: {
        ...openingHours[day],
        ...updates,
      },
    };
    setOpeningHours(newHours);
    onChange(newHours);
  };

  const toggleDay = (day: string) => {
    updateDay(day, { isOpen: !openingHours[day].isOpen });
  };

  const addTimeSlot = (day: string) => {
    const newHours = {
      ...openingHours,
      [day]: {
        ...openingHours[day],
        hours: [...openingHours[day].hours, { open: '09:00', close: '17:00' }],
      },
    };
    setOpeningHours(newHours);
    onChange(newHours);
  };

  const removeTimeSlot = (day: string, index: number) => {
    const newHours = {
      ...openingHours,
      [day]: {
        ...openingHours[day],
        hours: openingHours[day].hours.filter((_, i) => i !== index),
      },
    };
    setOpeningHours(newHours);
    onChange(newHours);
  };

  const updateTimeSlot = (day: string, index: number, field: 'open' | 'close', value: string) => {
    const newHours = {
      ...openingHours,
      [day]: {
        ...openingHours[day],
        hours: openingHours[day].hours.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    };
    setOpeningHours(newHours);
    onChange(newHours);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Store Opening Hours
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Set your store's opening hours for each day of the week
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.key} className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={day.key}
                checked={openingHours[day.key].isOpen}
                onCheckedChange={() => toggleDay(day.key)}
              />
              <Label htmlFor={day.key} className="font-medium">
                {day.label}
              </Label>
            </div>
            
            {openingHours[day.key].isOpen && (
              <div className="ml-6 space-y-2">
                {openingHours[day.key].hours.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">From:</Label>
                      <select
                        value={slot.open}
                        onChange={(e) => updateTimeSlot(day.key, index, 'open', e.target.value)}
                        className="px-3 py-1 border rounded-md text-sm"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">To:</Label>
                      <select
                        value={slot.close}
                        onChange={(e) => updateTimeSlot(day.key, index, 'close', e.target.value)}
                        className="px-3 py-1 border rounded-md text-sm"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {openingHours[day.key].hours.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTimeSlot(day.key, index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(day.key)}
                  className="text-primary hover:text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Time Slot
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
