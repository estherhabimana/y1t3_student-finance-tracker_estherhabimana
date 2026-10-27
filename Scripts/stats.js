function round2(number) {
  return Math.round(number * 100) / 100;  
}

export function totalSum(records) {
  let total = 0;
  for (const record of records) {
    total += record.amount;
  }
  return round2(total);
}

export function topCategory(records) {
  const totals = new Map();
  for (const record of records) {
    const soFar = totals.get(record.category) || 0;
    totals.set(record.category, soFar + record.amount);
  }
  let best = null;
  for (const [name, total] of totals) {
    if (best === null || total > best.total) {
      best = { name: name, total: round2(total) };
    }
  }
  return best;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function last7Days(records, today = new Date()) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    days.push({ date: formatDate(day), total: 0 });
  }
  for (const record of records) {
    for (const day of days) {
      if (day.date === record.date) {
        day.total = round2(day.total + record.amount);
      }
    }
  }
  return days;
}

export function capStatus(total, cap) {
  if (!cap || cap <= 0) {
    return { state: 'none', message: '' };
  }
  const difference = round2(cap - total);
  if (difference >= 0) {
    return { state: 'under', message: difference.toFixed(2) + ' left before you reach your cap.' };
  }
  return { state: 'over', message: 'You are over your cap by ' + Math.abs(difference).toFixed(2) + '.' };
}