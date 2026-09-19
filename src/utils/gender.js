const GENDER_MAP = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
  M: 'MALE',
  F: 'FEMALE',
  MAN: 'MALE',
  WOMAN: 'FEMALE',
  OTHERS: 'OTHER'
}

export const normalizeGender = (value) => {
  if (value === null || value === undefined) return ''
  const key = String(value).trim().toUpperCase()
  return GENDER_MAP[key] || ''
}

