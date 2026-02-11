
function buildFluxFilter(fieldName, values) {
  if (!values?.length) return '';

  const conditions = values
    .map(v => `r["${fieldName}"] == "${v}"`)
    .join(' or ');

  return `|> filter(fn: (r) => ${conditions})`;
}

export const createPowerQueryForPlants = (plants, aggregateWindow) => `
      from(bucket: "PV")
        |> range(start: -24h)
		${buildFluxFilter("PVO_Plant", plants)}
        |> filter(fn: (r) => r["PVO_id"] == "66KV" or r["PVO_id"] == "CONTADOR01")
        |> filter(fn: (r) => r["_field"] == "P")
        |> aggregateWindow(every: ${aggregateWindow}, fn: mean, createEmpty: true)
    `;

export const createEnergyQueryForPlants = (plants) => `
      from(bucket: "PV")
        |> range(start: -24h)
        ${buildFluxFilter("PVO_Plant", plants)}
        |> filter(fn: (r) => r["type"] == "calculado")
        |> filter(fn: (r) => r["_field"] == "EPV")
        |> cumulativeSum()
    `;

export const createIrradianceQueryForPlants = (plants) => `
      from(bucket: "PV")
        |> range(start: -24h)
        ${buildFluxFilter("PVO_Plant", plants)}
        |> filter(fn: (r) => r["PVO_id"] == "METEO")
        |> filter(fn: (r) => r["_field"] == "RadPOA01")
        |> aggregateWindow(every: 15m, fn: mean, createEmpty: true)
    `;

export const createIrradiationQueryForPlants = (plants) => `
      from(bucket: "PV")
        |> range(start: -24h)
         ${buildFluxFilter("PVO_Plant", plants)}
        |> filter(fn: (r) => r["type"] == "calculado")
        |> filter(fn: (r) => r["_field"] == "H_PoA")
        |> cumulativeSum()
    `;

export const createProfitQueryForPlants = (plants) => `
	from(bucket: "PV")
  |> range(start: -24h)
  ${buildFluxFilter("PVO_Plant", plants)}
  |> filter(fn: (r) => r["type"] == "calculado")
  |> filter(fn: (r) => r["_field"] == "EPV")
  |> aggregateWindow(every: 1h, fn: sum, createEmpty: true)
  |> map(fn: (r) => ({ r with _value: r._value / 1000.0 }))  // Divide el valor por 1000
  |> limit(n:24)
  `

export const getPPInstallForPlants = (plants) => `
from(bucket: "PV")
  |> range(start: -24h)
  ${buildFluxFilter("PVO_Plant", plants)}
  |> filter(fn: (r) => r["_field"] == "PPInstal")
  |> last()
`

export const createAvEleForPlants = (plants) => `
	from(bucket: "PV")
  |> range(start: -24h)
  ${buildFluxFilter("PVO_Plant", plants)}
  |> filter(fn: (r) => r["PVO_id"] == "ESTADO" or  r["PVO_id"] == "66KV")
  |> filter(fn: (r) => r["_field"] == "DispoElec" or r["_field"] == "AvEle")
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)
  |> keep(columns: ["_time", "PVO_Plant", "_value"])
  |> last()
  `

export const createAvMecForPlants = (plants) => `
from(bucket: "PV")
  |> range(start: -24h)
  ${buildFluxFilter("PVO_Plant", plants)}
  |> filter(fn: (r) => r["PVO_id"] == "ESTADO")
  |> filter(fn: (r) => r["_field"] == "DispoMec")
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)
  |> last()

`

export const createEPVQueryForPlants = (plants) => `
      from(bucket: "PV")
        |> range(start: -24h)
        ${buildFluxFilter("PVO_Plant", plants)}
        |> filter(fn: (r) => r["type"] == "calculado")
        |> filter(fn: (r) => r["_field"] == "EPV")
        |> cumulativeSum()
        |> last()
    `;