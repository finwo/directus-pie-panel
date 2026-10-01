<script lang="ts">
import { useApi, useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { abbreviateNumber } from '@directus/utils';
import ApexCharts from 'apexcharts';
import { get } from 'lodash';
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const FALLBACK_PALETTE = [
	'#6644FF',
	'#3B82F6',
	'#10B981',
	'#F59E0B',
	'#EF4444',
	'#8B5CF6',
	'#EC4899',
	'#14B8A6',
	'#F97316',
	'#6366F1',
];

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},
		width: {
			type: Number,
			default: 12,
		},
		height: {
			type: Number,
			default: 8,
		},
		collection: {
			type: String,
			default: null,
		},
		filter: {
			type: Object,
			// eslint-disable-next-line vue/require-valid-default-prop
			default: {},
		},
		dataValues: {
			type: String,
			default: null,
		},
		dataLabels: {
			type: String,
			default: null,
		},
		colors: {
			type: Array,
			default: () => [],
		},
		labelGrouping: {
			type: String,
			default: 'sum',
		},
		sortDirection: {
			type: String,
			default: 'desc',
		},
		showLegend: {
			type: Boolean,
			default: true,
		},
		showDataLabel: {
			type: Boolean,
			default: true,
		},
	},
	setup(props) {
		const { t } = useI18n();
		const api = useApi();
		const { usePermissionsStore } = useStores();
		const { hasPermission } = usePermissionsStore();
		const canRead = hasPermission(props.collection, 'read');
		const hasError = ref<boolean>(false);

		const errorResponse = ref<Record<string, string>>({
			title: '',
			message: '',
		});

		const isLoading = ref<boolean>(true);

		const chartEl = ref();
		const chart = ref<ApexCharts>();

		onMounted(setUpChart);

		watch(
			[
				() => props.collection,
				() => props.filter,
				() => props.dataValues,
				() => props.dataLabels,
				() => props.colors,
				() => props.width,
				() => props.height,
				() => props.labelGrouping,
				() => props.sortDirection,
				() => props.showLegend,
				() => props.showDataLabel,
			],
			() => {
				chart.value?.destroy();
				setUpChart();
			},
		);

		onUnmounted(() => {
			chart.value?.destroy();
		});

		function colorFor(rawLabel: string): string {
			const rules: Array<Record<string, string>> = Array.isArray(props.colors) ? props.colors : [];
			const needle = String(rawLabel).trim();
			for (const rule of rules) {
				if (String(rule.label).trim() === needle) {
					return rule.color;
				}
			}
			return '';
		}

		async function setUpChart() {
			if (!props.dataValues || !props.dataLabels)
				return;

			const categories = ref<Array<string>>([]);
			const rawLabels = ref<Array<string>>([]);
			const category_data = ref<Array<number>>([]);

			try {
				const response = await api.get(`/items/${props.collection}`, {
					params: {
						limit: '-1',
						filter: {
							_and: [
								props.filter,
								{
									[props.dataLabels]: { _nempty: true },
								},
							],
						},
						aggregate: {
							[props.labelGrouping]: props.dataValues,
						},
						groupBy: [props.dataLabels],
					},
				});

				const data: Array<Record<string, any>> = response.data.data.sort((a: Record<string, any>, b: Record<string, any>) => props.sortDirection === 'desc'
					? b[props.labelGrouping].value - a[props.labelGrouping].value
					: a[props.labelGrouping].value - b[props.labelGrouping].value,
				);

				data.forEach((item: Record<string, any>) => {
					rawLabels.value.push(get(item, props.dataLabels));
					categories.value.push(formatTitle(get(item, props.dataLabels)));
					const y_value = get(item[props.labelGrouping], props.dataValues);
					category_data.value.push(y_value === y_value * 1 ? y_value * 1 : y_value);
				});

				const chartColors = rawLabels.value.map((raw, i) => colorFor(raw) || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]);

				const borderColor = 'var(--theme--border-color-subdued)';

				chart.value = new ApexCharts(chartEl.value, {
					chart: {
						type: 'donut',
						animation: {
							enabled: false,
						},
						height: '100%',
						width: '100%',
						dropShadow: {
							enabled: false,
						},
						toolbar: {
							show: false,
						},
						fontFamily: 'var(--theme--fonts--sans--font-family)',
						foreColor: 'var(--theme--foreground-subdued)',
						background: 'transparent',
					},
					series: category_data.value,
					labels: categories.value,
					colors: chartColors,
					plotOptions: {
						pie: {
							donut: {
								size: '65%',
								labels: {
									show: true,
									name: {
										show: true,
									},
									value: {
										show: true,
										formatter(val: string) {
											return abbreviateNumber(Number(val), 1);
										},
									},
									total: {
										show: true,
										label: t('total'),
										fontFamily: 'var(--theme--fonts--sans--font-family)',
										formatter(w: Record<string, any>) {
											return abbreviateNumber(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0), 1);
										},
									},
								},
							},
							expandOnClick: false,
						},
					},
					dataLabels: {
						enabled: props.showDataLabel,
						formatter(val: number) {
							return abbreviateNumber(val, 1);
						},
						dropShadow: {
							enabled: false,
						},
					},
					legend: {
						show: props.showLegend,
						position: 'bottom',
						markers: {
							shape: 'circle',
						},
						labels: {
							colors: 'var(--theme--foreground-subdued)',
						},
					},
					tooltip: {
						enabled: true,
						marker: {
							show: true,
						},
						y: {
							formatter(val: number) {
								return abbreviateNumber(val, 1);
							},
						},
					},
					stroke: {
						colors: ['var(--theme--background-normal)'],
						width: 2,
					},
					grid: {
						borderColor,
						padding: {
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
						},
					},
				});

				chart.value.render();
				isLoading.value = false;
			}
			catch (error: any) {
				errorResponse.value.title = error.code || 'UNKNOWN';
				errorResponse.value.message = error.message || t('errors.UNKNOWN');
				hasError.value = true;
				isLoading.value = false;
			}
		}

		return {
			t,
			isLoading,
			chartEl,

			// Errors
			hasError,
			errorResponse,

			// Permission
			canRead,
		};
	},
});
</script>

<template>
	<div class="pie-chart" :class="{ 'has-header': showHeader }">
		<v-info v-if="!collection" type="danger" icon="error" center title="No Collection Selected" />
		<v-info v-else-if="!dataValues || !dataLabels" type="warning" icon="warning" center title="Both Value and Label fields must be selected" />
		<v-info v-else-if="!canRead" type="danger" icon="error" center title="Forbidden">
			You do not have permissions to see this table
		</v-info>
		<v-info v-else-if="hasError" type="danger" icon="error" :title="errorResponse?.title">
			{{ errorResponse?.message }}
		</v-info>
		<VProgressCircular v-else-if="isLoading" indeterminate />
		<div ref="chartEl" />
	</div>
</template>

<style scoped>
.pie-chart {
	height: 100%;
	padding: 12px;
}

.pie-chart.has-header {
	padding: 0 12px;
}
</style>