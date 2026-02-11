import { flux } from "@influxdata/influxdb-client";


import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./utils/fieldFilter.txt');

const blockedFields = fs
  .readFileSync(filePath, 'utf-8')
  .split('\n')
  .map(line => line.trim())        // quitar espacios
  .filter(line => line.length > 0); // eliminar líneas vacías

// Construimos el string Flux dinámicamente
const fluxFilter = `|> filter(fn: (r) => ${blockedFields.map(f => `r._field !~ /${f}/`).join(' and ')})`;

function buildFluxFilter(fieldName, values) {
  if (!values?.length) return '';

  const conditions = values
    .map(v => `r["${fieldName}"] == "${v}"`)
    .join(' or ');

  return `|> filter(fn: (r) => ${conditions})`;
}

export const createStationsDataQuery = () => `
		from(bucket: "GeoMap")
			|> range(start: -24h)
			|> filter(fn: (r) => r["_measurement"] == "modbus")
			|> last()
			|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
			|> keep(columns: ["AvEle","AvMec","Irrad","P","Q","latitude","longitude","Plant","host","name"])
			|> group()
		`


export const getAllPLantsQuery = flux`
    import "influxdata/influxdb/schema"
    schema.tagValues(
      bucket: "PV",
      tag: "PVO_Plant"
    )
  `

export const createPowerQueryForPlant = (plantName, aggregateWindow) => `
      from(bucket: "PV")
        |> range(start: -24h)
        |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
        |> filter(fn: (r) => r["PVO_id"] == "66KV" or r["PVO_id"] == "CONTADOR01")
        |> filter(fn: (r) => r["_field"] == "P")
        |> aggregateWindow(every: ${aggregateWindow}, fn: mean, createEmpty: true)
    `;



export const createEnergyQueryForPlant = (plantName) => `
      from(bucket: "PV")
        |> range(start: -24h)
        |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
        |> filter(fn: (r) => r["type"] == "calculado")
        |> filter(fn: (r) => r["_field"] == "EPV")
        |> cumulativeSum()
        |> last()
    `;

export const createIrradianceQueryForPlant = (plantName) => `
      from(bucket: "PV")
        |> range(start: -24h)
        |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
        |> filter(fn: (r) => r["PVO_id"] == "METEO")
        |> filter(fn: (r) => r["_field"] == "RadPOA01")
        |> aggregateWindow(every: 15m, fn: mean, createEmpty: true)
    `;

export const createIrradiationQueryForPlant = (plantName) => `
      from(bucket: "PV")
        |> range(start: -24h)
        |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
        |> filter(fn: (r) => r["type"] == "calculado")
        |> filter(fn: (r) => r["_field"] == "H_PoA")
        |> cumulativeSum()
        |> last()
    `;



export const getPrecio02OmieQuery = () => `
  from(bucket: "Omie")
    |> range(start: -24h)
    |> filter(fn: (r) => r["_measurement"] == "file")
    |> filter(fn: (r) => r["_field"] == "precio02")
`
export const createProfitQueryForPlant = (plantName) => `
	from(bucket: "PV")
  |> range(start: -24h)
  |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
  |> filter(fn: (r) => r["type"] == "calculado")
  |> filter(fn: (r) => r["_field"] == "EPV")
  |> aggregateWindow(every: 15m, fn: sum, createEmpty: false)
  |> map(fn: (r) => ({ r with _value: r._value / 1000.0 }))  // Divide el valor por 1000
  |> yield(name: "mean")
  `

export const createAvEleForPlant = (plantName) => `
	from(bucket: "PV")
  |> range(start: -24h)
  |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
  |> filter(fn: (r) => r["PVO_id"] == "ESTADO" or  r["PVO_id"] == "66KV")
  |> filter(fn: (r) => r["_field"] == "DispoElec" or r["_field"] == "AvEle")
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)
  |> keep(columns: ["_time", "PVO_Plant", "_value"])
  |> last()
  `

export const createAvMecForPlant = (plantName) => `
from(bucket: "PV")
  |> range(start: -24h)
  |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
  |> filter(fn: (r) => r["PVO_id"] == "ESTADO")
  |> filter(fn: (r) => r["_field"] == "DispoMec")
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: true)
  |> last()

`
export const getPPInstallForPlant = (plantName) => `
from(bucket: "PV")
  |> range(start: -24h)
  |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
  |> filter(fn: (r) => r["_field"] == "PPInstal")
  |> last()
`


export const createEPVQueryForPlant = (plantName) => `
      from(bucket: "PV")
        |> range(start: -24h)
        |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
        |> filter(fn: (r) => r["type"] == "calculado")
        |> filter(fn: (r) => r["_field"] == "EPV")
        |> cumulativeSum()
        |> last()
    `;

export const createDailyQueryForPlant = (plantName, start, end) => `
      import "date"
      import "experimental"
      
      from(bucket: "PV")
        |> range(start: ${start}, stop: ${end})
        |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
  |> filter(fn: (r) => r["type"] == "calculado")
  |> filter(fn: (r) => r["_field"] == "DailyEPV")
  |> aggregateWindow(every: 1d, fn: mean, createEmpty: true)
  |> yield(name: "mean")
    `

export const createGetFieldsQuery = () => `
  	from(bucket: "PV")
    	|> range(start: -24h)
		|> filter(fn: (r) => r.type == "holding_register")
		|> keep(columns: ["_field"])
		|> distinct(column: "_field")
		|> limit(n: 500)
		|> sort(columns: ["_field"])
		|> yield(name: "distinct_values")
`


export const getTagValuesQuery = (tag) => `
	import "influxdata/influxdb/schema"

	schema.tagValues(
		bucket: "PV",
		tag: "${tag}",
		start: -24h
	) 
`

export function buildTagValuesQuery(
  bucket,
  tag,
  filters,
  start = "-24h"
) {

  const predicates = Object.entries(filters)
    .map(([key, values]) => {
      // Cada grupo: r["key"] == "v1" or r["key"] == "v2"
      const ors = values.map(v => `r["${key}"] == "${v}"`).join(" or ");
      return values.length > 1 ? `(${ors})` : ors;
    })
    .join(" and ");

  // Si hay filtros, los metemos en predicate, si no, lo dejamos vacío
  const predicate = predicates ? `, predicate: (r) => ${predicates}` : "";

  return `
		import "influxdata/influxdb/schema"

		schema.tagValues(
		bucket: "${bucket}",
		tag: "${tag}",
		start: ${start}${predicate}
		)`;
}

export const buildFieldKeysQuery = (
  bucket,
  filters,
  start = "-24h"
) => {

  // Generamos los filtros en formato Flux
  const predicates = Object.entries(filters)
    .map(([key, values]) => {
      const ors = values.map(v => `r["${key}"] == "${v}"`).join(" or ");
      return values.length > 1 ? `(${ors})` : ors;
    })
    .join(" and ");

  const predicate = predicates ? `, predicate: (r) => ${predicates}` : "";

  return `
    import "influxdata/influxdb/schema"

    schema.fieldKeys(
      bucket: "${bucket}",
      start: ${start}${predicate}
    )
  `;
}


function buildPredicate(filters, userPlants) {
  const activeFilters = filters.filter(f => f.selectedValues.length > 0);

  if (activeFilters.length === 0) {
    return "";
  }
  let alreadyFilteredPlant = false;
  let filterConditions = activeFilters
    .map(f => {
      if (f.key === "PVO_Plant") {
        alreadyFilteredPlant = true
      }

      const orValues = f.selectedValues.map(v => `r["${f.key}"] == "${v}"`).join(" or ");
      return f.selectedValues.length > 1 ? `(${orValues})` : orValues;
    });
  let predicateStr = ""
  if (!alreadyFilteredPlant) {
    const orValues = userPlants.map(v => `r["PVO_Plant"] == "${v}"`).join(" or ") || "";
    if (orValues.length > 1) {
      predicateStr = [...filterConditions, `(${orValues})`].join(" and ")
    } else {
      predicateStr = [...filterConditions, orValues].join(" and ")
    }
  } else {
    predicateStr = filterConditions.join(" and ")
  }

  return predicateStr ? ` (r) => ${predicateStr}` : "";
}

let aggregacionesRaras = [
  'distinct',
  'count',
  'increase',
  'skew',
  'spread',
  'unique',
  'sort',
]



function construirQuery(windowPeriod, aggregateFunction, offset) {

  if (aggregacionesRaras.includes(aggregateFunction)) {
    return `
      |> ${aggregateFunction}()
      |> yield(name: "${aggregateFunction}")
    `;
  }

  if (aggregateFunction === 'derivative') {
    return `
      |> derivative(unit: 1s, nonNegative: false)
      |> yield(name: "${aggregateFunction}")
    `;
  }
  if (aggregateFunction === 'nonnegative derivative') {
    return `
      |> derivative(unit: 1s, nonNegative: true)
      |> yield(name: "${aggregateFunction}")
    `;
  }

  // Opcional: fallback (por si viene algo no contemplado)
  return `
    |> aggregateWindow(every: ${windowPeriod}, fn: ${aggregateFunction}, createEmpty: true, location: {zone:"Europe/Madrid", offset: ${offset}})
    |> yield(name: "result")
  `;
}

export const buildQuery = (selectedBucket, filters, timeRange, windowPeriod, aggregateFunction, userPlants, offset) => {
  const predicate = buildPredicate(filters, userPlants);
  let start, stop;


  if (timeRange.start && timeRange.stop) {
    const localStart = new Date(timeRange.start);
    const localStop = new Date(timeRange.stop);

    // Convertirlos a UTC “real” 
    const utcStart = new Date(localStart.getTime() + localStart.getTimezoneOffset() * 60000);
    const utcStop = new Date(localStop.getTime() + localStop.getTimezoneOffset() * 60000);

    start = utcStart.toISOString();
    stop = utcStop.toISOString();
  } else {
    // Calcular últimas 24 h en UTC
    const nowUtc = new Date();
    const stopUtc = nowUtc.toISOString();
    const startUtc = new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000).toISOString();

    start = startUtc;
    stop = stopUtc;
  }

  return `
			from(bucket: "${selectedBucket}")
				|> range(start: time(v: ${JSON.stringify(start)}) , stop: time(v: ${JSON.stringify(stop)}))
				${predicate ? `|> filter(fn: ${predicate})` : ""}
        ${fluxFilter}
        
				${construirQuery(windowPeriod, aggregateFunction, offset)}
			`;

}

export const createCPUusage = () => `
      import "date"
      import "experimental"

      from(bucket: "Metrics")
        |> range(start: -15m)
      |> filter(fn: (r) => r["_field"] == "cpu_usage")
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
  |> yield(name: "mean")
    `;


export const createMEMused = () => `
      import "date"
      import "experimental"

      from(bucket: "Metrics")
        |> range(start: -1m)
      |> filter(fn: (r) => r["_field"] == "mem_used")
  |> aggregateWindow(every: 1m, fn: last, createEmpty: false)
  |> yield(name: "last")
    `;

export const createSystemMetrics = () => `
      import "date"
      import "experimental"

      from(bucket: "Metrics")
        |> range(start: -15s)
      |> filter(fn: (r) => r["_measurement"] == "system_metrics")
  |> aggregateWindow(every: 15s, fn: last, createEmpty: false)
  |> yield(name: "last")
    `;

export const createBucketMetrics = (start, end, aggregation) => `
      import "date"
      import "experimental"

      from(bucket: "Metrics")
        |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r["_measurement"] == "bucket_metrics")
  |> aggregateWindow(every: ${aggregation}, fn: last, createEmpty: false)
  |> yield(name: "last")
    `;

    export const plantHeartbeat = (plantName, aggregateWindow) => `
      from(bucket: "PV")
        |> range(start: -10m)
        |> filter(fn: (r) => r["PVO_Plant"] == "${plantName}")
        |> filter(fn: (r) => r["PVO_id"] == "66KV" or r["PVO_id"] == "CONTADOR01")
        |> filter(fn: (r) => r["_field"] == "P")
        |> aggregateWindow(every: ${aggregateWindow}, fn: last, createEmpty: false)
    `;