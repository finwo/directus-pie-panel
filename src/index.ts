import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'panel-pie-chart',
	name: 'Pie Chart',
	icon: 'pie_chart',
	description: 'Generate a pie chart from a label and value field',
	component: PanelComponent,
	options: [
		{
			field: 'collection',
			type: 'string',
			name: '$t:collection',
			meta: {
				interface: 'system-collection',
				required: true,
				options: {
					includeSystem: true,
					includeSingleton: false,
					placeholder: '$t:select_a_collection',
				},
				width: 'full',
			},
		},
		{
			field: 'filter',
			type: 'json',
			name: '$t:filter',
			meta: {
				interface: 'system-filter',
				options: {
					collectionField: 'collection',
					relationalFieldSelectable: true,
				},
			},
		},
		{
			field: 'dataValues',
			type: 'string',
			name: '$t:panels.time_series.value_field',
			meta: {
				interface: 'system-field',
				required: true,
				options: {
					collectionField: 'collection',
					placeholder: '$t:select_a_field',
					typeAllowList: ['integer', 'bigInteger', 'float', 'decimal'],
				},
				width: 'half',
			},
		},
		{
			field: 'dataLabels',
			type: 'string',
			name: '$t:displays.labels.labels',
			meta: {
				interface: 'system-field',
				required: true,
				options: {
					collectionField: 'collection',
					placeholder: '$t:select_a_field',
					allowPrimaryKey: true,
				},
				width: 'half',
			},
		},
		{
			field: 'labelGrouping',
			type: 'string',
			name: '$t:group_aggregation',
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							value: 'sum',
							text: '$t:sum',
						},
						{
							value: 'count',
							text: '$t:count',
						},
						{
							value: 'avg',
							text: '$t:avg',
						},
						{
							value: 'max',
							text: '$t:max',
						},
						{
							value: 'min',
							text: '$t:min',
						},
					],
				},
				width: 'half',
			},
			schema: {
				default_value: 'sum',
			},
		},
		{
			field: 'sortDirection',
			type: 'string',
			name: '$t:sort_direction',
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							value: 'desc',
							text: '$t:sort_desc',
						},
						{
							value: 'asc',
							text: '$t:sort_asc',
						},
					],
				},
				required: false,
				width: 'half',
			},
			schema: {
				default_value: 'desc',
			},
		},
		{
			field: 'colors',
			type: 'json',
			name: 'Label Colors',
			meta: {
				interface: 'list',
				options: {
					template: '{{ label }}: {{ color }}',
					fields: [
						{
							field: 'label',
							type: 'string',
							name: 'Label',
							meta: {
								interface: 'input',
								width: 'half',
							},
						},
						{
							field: 'color',
							type: 'string',
							name: 'Color',
							meta: {
								interface: 'select-color',
								width: 'half',
							},
						},
					],
				},
			},
		},
		{
			field: 'showLegend',
			name: '$t:panels.pie_chart.show_legend',
			type: 'boolean',
			schema: {
				default_value: true,
			},
			meta: {
				interface: 'boolean',
				width: 'half',
			},
		},
		{
			field: 'showDataLabel',
			name: '$t:show_data_label',
			type: 'boolean',
			schema: {
				default_value: true,
			},
			meta: {
				interface: 'boolean',
				width: 'half',
			},
		},
	],
	minWidth: 12,
	minHeight: 8,
});