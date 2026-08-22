import React from "react";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRangeDates(range) {
  const today = new Date();

  const start = new Date(today);
  const end = new Date(today);

  switch (range) {
    case "today":
      break;

    case "7d":
      start.setDate(today.getDate() - 6);
      break;

    case "30d":
      start.setDate(today.getDate() - 29);
      break;

    case "90d":
      start.setDate(today.getDate() - 89);
      break;

    case "this_month":
      start.setDate(1);
      break;

    case "this_year":
      start.setMonth(0, 1);
      break;

    default:
      return null;
  }

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
];

export default function AccountantReportFilters({
  filters,
  onChange,
}) {
  const applyPreset = (range) => {
    const dates = getRangeDates(range);

    if (!dates) {
      return;
    }

    onChange({
      ...filters,
      range,
      start: dates.start,
      end: dates.end,
    });
  };

  const handleDateChange = (field, value) => {
    const nextFilters = {
        ...filters,
        range: "custom",
        [field]: value,
    };

    if (
        nextFilters.start &&
        nextFilters.end &&
        nextFilters.start > nextFilters.end
    ) {
        return;
    }

    onChange(nextFilters);
    };

  return (
    <div
      className="card"
      style={{
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={
              filters.range === preset.value
                ? "btn-primary"
                : "btn-secondary"
            }
            onClick={() => applyPreset(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "end",
        }}
      >
        <label>
          <div className="muted" style={{ marginBottom: 5 }}>
            Start Date
          </div>

          <input
            className="input"
            type="date"
            value={filters.start}
            onChange={(event) =>
              handleDateChange("start", event.target.value)
            }
          />
        </label>

        <label>
          <div className="muted" style={{ marginBottom: 5 }}>
            End Date
          </div>

          <input
            className="input"
            type="date"
            value={filters.end}
            onChange={(event) =>
              handleDateChange("end", event.target.value)
            }
          />
        </label>
      </div>
    </div>
  );
}