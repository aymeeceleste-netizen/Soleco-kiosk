import { COP_BY_TEMP_HEAT, TEMP_STOPS_HEAT, type CopRow } from '../data';
import { t } from '../i18n';
import type { KioskState } from '../state';
import { store } from '../state';
import type { ModeView } from './_types';

type Pt = { x: number; y: number };
type Dict = ReturnType<typeof t>;

/* Heat pump SVG drawn directly on canvas (from HTML prototype) */
const HEATPUMP_SVG =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNOTQuNzQ4NSAxNzIuNjA5Qzk1LjM4MDUgMTcyLjU2IDk2LjExNiAxNzIuNDk1IDk2Ljc0OCAxNzIuNDk0QzExNy4yNDEgMTcyLjQ1OCAxMzcuNzgzIDE3Mi40ODMgMTU4LjI3MyAxNzIuNDk4TDI3NC44MjUgMTcyLjUwOUw2MTguNDUgMTcyLjQ4NEw4MjUuMDA1IDE3Mi41MDRMODkyLjE5IDE3Mi40NDZDOTA0LjMxIDE3Mi40MjMgOTE2Ljc5IDE3Mi4yODUgOTI4Ljg5NSAxNzIuNjE1QzkzMy4zIDE3Mi43MzQgOTM4LjkgMTc1LjcwOSA5NDEuOTggMTc4LjgzNEM5NDYuNzkgMTgzLjcwOCA5NDguMzM1IDE4OS41OTYgOTQ4LjM1IDE5Ni4yODlDOTQ4LjQzIDI0My43MjIgOTQ4LjQxNSAyOTEuMjAzIDk0OC40MDUgMzM4LjYzMUw5NDguMzYgNjAyLjAxNUw5NDguNDEgNzQ2LjYxTDk0OC40IDc5MkM5NDguNDA1IDc5OC42OSA5NDguNzQ1IDgxMC4xNCA5NDguMjM1IDgxNi40N0M5NDcuOCA4MjEuNDk1IDk0NS41NyA4MjYuMTk1IDk0MS45NTUgODI5LjcwNUM5MzIuOTM1IDgzOC42MTUgOTE5LjQxNSA4MzYuMjcgOTA3LjYxNSA4MzYuMjlMODcwLjcxIDgzNi40MjVDODcwLjQ3IDgzOC40NzUgODY5Ljg1NSA4NDEuMDQ1IDg2OS40MiA4NDMuMTA1Qzg2OC4yNDUgODQ5LjI1IDg2Ny4xIDg1OS42NTUgODU4LjY3NSA4NTkuODlDODQ3Ljg0IDg2MC4xOTUgODM2Ljg5IDg1OS45MiA4MjYuMDI1IDg1OS45MzVMNzk0LjAyNSA4NTkuOTQ1Qzc4OC43MDUgODU5Ljk0IDc3OS4xNzUgODYwLjA4NSA3NzQuMjg1IDg1OS4zMUM3NjcuNjEgODU4LjI1NSA3NTYuNDU1IDg0Mi4wNTUgNzUyLjM2NSA4MzYuNDhDNzIxLjQgODM2LjIwNSA2OTAuNDM1IDgzNi4xNjUgNjU5LjQ3NSA4MzYuMzY1TDQ3MS40MyA4MzYuMzI1TDM1MS40NiA4MzYuMzZDMzI1LjYyNyA4MzYuMzE1IDI5OC4wNjEgODM1Ljc5NSAyNzIuMzU4IDgzNi4zN0MyNjYuMDE2IDg0My41MyAyNTkuNjUzIDg1My4zNSAyNTEuODYxIDg1OC44QzI1MC45MjMgODU5LjQ1NSAyNDUuMTA2IDg2MC4xMTUgMjQzLjYxIDg2MC4xMDVDMjE4LjcwNiA4NTkuODYgMTkzLjc4NSA4NjAuMTIgMTY4Ljg4MiA4NTkuOTU1QzE1OS4zNzkgODU5Ljg5NSAxNTcuMTc5IDg1NS44OCAxNTUuMzc2IDg0Ny4wNTVDMTU0LjY2NSA4NDMuNTggMTUzLjkyOCA4MzkuOTA1IDE1My4yMTQgODM2LjRDMTM5LjUxOSA4MzUuOTQ1IDEyNS41MTEgODM2LjQ1IDExMS40MDcgODM2LjMyNUM5Ny4yNzUgODM2LjIwNSA4MS40NjI1IDgzNy44NTUgNzYuNTU5NSA4MTkuNzZDNzQuOTg3NSA4MTMuOTYgNzUuODkwNSA4MDIuMjkgNzUuOTA2NSA3OTYuMDA1TDc1Ljg4MiA3NTUuNTU1TDc1Ljc5NSA2MzQuODc1TDc1Ljg5MDUgMzQxLjUyN0w3NS43NDk1IDI0Ni4yMzlDNzUuNzA5IDIzMC4wOTIgNzUuNTYgMjEzLjkwMSA3NS41NjYgMTk3Ljc3OUM3NS41Njg1IDE5Mi43MTIgNzYuMDg0IDE4Ni42NzIgNzkuMTQ4IDE4Mi42MDhDODMuOTk1IDE3Ni4xNzkgODcuMTQ5NSAxNzQuMTQ0IDk0Ljc0ODUgMTcyLjYwOVoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTk2LjMzMiAxODEuNTk0QzEyMS44NTQgMTgwLjgzNSAxNTAuNTYgMTgxLjUyNiAxNzYuNCAxODEuNTI1TDMzNC41NyAxODEuNTIxTDc4Ny41NSAxODEuNTg1Qzc4Ni43MyAyMjAuOCA3ODguMTQ1IDI2MC40ODQgNzg3LjUwNSAyOTkuNzU1Qzc4Ny4zMyAzMTAuNDc4IDc4Ny40ODUgMzIyLjM1NSA3ODkuNjQgMzMyLjc4OUM3OTUuODM1IDM2Mi44NCA4MTIuNDc1IDM5MC4wNDEgODEzLjU1NSA0MjEuMzc4QzgxNC4yNSA0MzkuNDY3IDgxNC4wODUgNDU3LjYzMyA4MTQuMDkgNDc1LjgxNUw4MTQuMDc1IDU2Ny4wNDVMODEzLjk3NSA4MjcuNDg1TDgwMi43NSA4MjcuNDY1TDMyOS41OSA4MjcuNDZIMTc2Ljc4MUMxNTAuOTE1IDgyNy40NjUgMTI0Ljc2MSA4MjguMyA5OC45MjcgODI3LjQyNUM5Ni42NzggODI3LjM1IDk0Ljg5MzUgODI3LjE2NSA5Mi44NDggODI2LjE2Qzg5LjcwMTUgODI0LjYwNSA4Ni45IDgyMS43OCA4NS43NTQgODE4LjQzNUM4My40NjYgODExLjc1IDg0LjYzMDUgNzY2Ljg5NSA4NC42MzkgNzU2LjNMODQuNjI4NSA2NjMuMjVMODQuNjIxIDIwMS43MTlDODQuNzAwNSAxOTEuMjE1IDg1LjAxNDUgMTg1LjA2MSA5Ni4zMzIgMTgxLjU5NFoiIGZpbGw9IiMzMTMyMzIiLz4KPHBhdGggZD0iTTc0NC41MyAyMjYuMDM1TDc1Ni4zNDUgMjI2LjAxNkM3NTYuOTk1IDI0Ni40MzMgNzU2LjI4NSAyNzAuMTM3IDc1Ni4yNTUgMjkwLjkwOUw3NTYuMzQgNDEyLjc0NUw3NTYuMjkgNzg0LjgxNUM3NTQuNzY1IDc4NS4yOSA3NDYuOTc1IDc4NS4wNiA3NDQuODQ1IDc4NS4wMzVMNzQ0LjY2NSAzNTQuNzY1Qzc0NC42MSAzMTEuOTU1IDc0NS4wMyAyNjguODIzIDc0NC41MyAyMjYuMDM1WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNMTM2LjkxIDIyNi4xODVDMTQwLjgzNCAyMjYuMzE2IDE0NC4xMTMgMjI2LjI4MiAxNDguMDQyIDIyNi4xNTlDMTQ4LjY5MiAyMzUuNTg2IDE0OC40IDI0Ny4zNjcgMTQ4LjQgMjU2Ljg5NUwxNDguMzg2IDMwOC4xNDlMMTQ4LjQyMiA0NjUuODA4TDE0OC4zOTMgNjc3LjkzTDE0OC40MDIgNzQ1LjgyQzE0OC40MjEgNzU3LjY1IDE0OC40ODIgNzY5LjU3IDE0OC40MjQgNzgxLjQxQzE0OC40MTUgNzgzLjM0IDE0OC41NzIgNzg0LjEgMTQ3LjUwOSA3ODUuMDhMMTM2Ljk0MyA3ODUuMDY1TDEzNi43ODIgNDE1LjgxM0wxMzYuODM2IDI5MC45NTJDMTM2LjgyOCAyNzEuMjkzIDEzNS45OTIgMjQ1LjIyOSAxMzYuOTEgMjI2LjE4NVoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTEyMC41OTQgMjI2LjA3TDEzMi4xNiAyMjYuMjlDMTMxLjQyNSAyODUuNTcgMTMyLjA3MiAzNDYuMTQ3IDEzMi4wODMgNDA1LjU2NUwxMzIuMDY5IDc4NS4wNkwxMjAuNTYyIDc4NC45N0wxMjAuNTk0IDIyNi4wN1oiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTE1Ny42ODcgMjI2LjI1NkwxNjQuNDc0IDIyNi4xNjdMMTY0LjQ2NCA2MDUuMDVMMTY0LjQ2NCA3MjEuMjVDMTY0LjQ3MSA3NDIuMDIgMTY0Ljg3NCA3NjMuODI1IDE2NC40MDEgNzg0LjQ3QzE2My4zNDggNzg1LjM2NSAxNjIuNjkzIDc4NS4wNCAxNjAuOTIgNzg1LjEwNUwxNTIuOTkzIDc4NS4wMDVWNDAyLjY5NUwxNTMuMDEyIDI4NC4wNTVMMTUyLjk3OSAyNDcuNzQ5QzE1Mi45NzQgMjQxLjk3NCAxNTIuNjk4IDIzMi40NiAxNTMuMjEzIDIyNi45NDFDMTU0Ljg3NSAyMjUuOTczIDE1NS40NTQgMjI2LjMyMSAxNTcuNjg3IDIyNi4yNTZaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik0xNjkuMDg1IDIyNi4yMzVMMTgwLjQ3NSAyMjYuMTVMMTgwLjU1MiA3ODUuMTI1TDE2OS4wODYgNzg1LjE0NUMxNjguMzYzIDc1Ny41OSAxNjkuMDYzIDcyNi41MDUgMTY5LjA2IDY5OC42OUwxNjkuMDc0IDUyMC42NjVMMTY5LjA1NSAzMjUuOTQyQzE2OS4wNSAyOTMuNDU0IDE2OC4zMzggMjU4LjUyNCAxNjkuMDg1IDIyNi4yMzVaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik0zMzUuNzgyIDIyNi4yNjZMMzQxLjU0NSAyMjYuMTg0TDM0MS40MDMgNzg0Ljk5NUwzMzUuNTA2IDc4NS4wNDVDMzMzLjQwMyA3ODUuMDU1IDMzMS44NzUgNzg1LjM1IDMzMC4yNzYgNzg0LjQwNUMzMjkuNjg3IDc3Ni44NSAzMjkuOTk1IDc2Ny4xNiAzMzAuMDEzIDc1OS4zNEwzMzAuMDExIDcxOS4zMzVMMzMwLjAxOCA1ODkuMjlMMzMwLjAyNSAzNTQuOTUyQzMzMC4wMjIgMzEyLjM4NSAzMjkuNTQxIDI2OC43MjcgMzMwLjEzMiAyMjYuMjY3TDMzNS43ODIgMjI2LjI2NloiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTMxNC4wMDUgMjI2LjMzMUwzMjUuMDk2IDIyNi40NDJDMzI1LjU5IDIzMy40NDkgMzI1LjM4OCAyNDMuMDUyIDMyNS4zOTEgMjUwLjI1MkwzMjUuMzc1IDI4OS43NkwzMjUuMzkgNDExLjY2NUwzMjUuMzg0IDc4NC45OUwzMTMuOTkyIDc4NS4xNTVDMzEzLjY1NCA3NjMuNDg1IDMxMy45MiA3NDAuOTg1IDMxMy45MTcgNzE5LjI4TDMxMy45MyA1OTQuMjk1TDMxNC4wMDUgMjI2LjMzMVoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTI5Ny43NzUgMjI2LjA4OEMzMDEuNTAyIDIyNi4yNTEgMzA1LjQwNCAyMjYuMTg2IDMwOS4xNTEgMjI2LjE4TDMwOS4zMjUgNzgwLjMxTDMwOS4yNjQgNzg1LjA4TDI5Ny44OTMgNzg1LjA5NUMyOTcuMDE1IDczMi44OCAyOTcuODEgNjc4LjY1IDI5Ny44MjcgNjI2LjI0NUwyOTcuNzc1IDIyNi4wODhaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik00NDIuMDcxIDIyNi4xODRMNDUzLjQ0OSAyMjYuMjQ4TDQ1My40MzYgNzg1LjAyNUw0NDIuMDUyIDc4NS4wNkw0NDIuMDEyIDQ4NC4wMzJMNDQyLjAwNiAzMTcuNDYzQzQ0Mi4wMDEgMjg3LjE2MyA0NDEuNzE1IDI1Ni40NDQgNDQyLjA3MSAyMjYuMTg0WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNMzQ2LjAxIDIyNi4xMjhMMzU3LjMwNCAyMjYuMjgyQzM1Ny44MTggMjQ1LjcyOSAzNTcuMzYxIDI2Ny40MzYgMzU3LjM1NSAyODcuMDA0TDM1Ny4zNTcgNDAxLjM5NUwzNTcuMzkxIDc4NS4wOEwzNDUuOTU5IDc4NS4xMjVMMzQ1LjkwMiA0MTUuMDI0TDM0NS45MzEgMjg4Ljk5OUMzNDUuOTQ3IDI2OC4zNTIgMzQ1LjU1MSAyNDYuNjQ2IDM0Ni4wMSAyMjYuMTI4WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNNzIxLjA1NSAyMjYuMjU5QzcyMi4xMTUgMjI2LjI2IDcyMi40NiAyMjYuMzQ5IDcyMy41MTUgMjI2LjUwNUM3MjQuNzggMjI5LjkxMSA3MjMuOTU1IDMzMS45NzIgNzIzLjk1NSAzNDIuODUzTDcyNC4wMSA3ODUuMTA1TDcxNS4zNzUgNzg1LjI2QzcxNC4wMiA3ODUuMjUgNzE0LjA3NSA3ODUuMjg1IDcxMi44MDUgNzg0LjgzNUM3MTEuNjQ1IDc4MC4zOCA3MTIuNTQgNzU1LjM5IDcxMi41NTUgNzQ4LjU1NUw3MTIuNTQgNjUzLjA0NUw3MTIuNTEgMjI2LjI2Nkw3MjEuMDU1IDIyNi4yNTlaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik0yNDkuNzQgMjI2LjI3NkwyNjAuOTg4IDIyNi4zNTVMMjYxLjA5MSA3ODUuMTE1TDI0OS43MzYgNzg1LjE2NUMyNDkuMjQ5IDc0My4wNDUgMjQ5LjY2NCA3MDAuNCAyNDkuNjY0IDY1OC4yNUwyNDkuNjIyIDQzNC4xNTRMMjQ5LjYwOCAyOTQuNjg1QzI0OS42MTcgMjcyLjkwMyAyNDguOTM4IDI0Ny44MTggMjQ5Ljc0IDIyNi4yNzZaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik00MTAuMTQyIDIyNi4xODVDNDEzLjc2MSAyMjYuMzg0IDQxNy43NjMgMjI2LjM3NyA0MjEuNDE4IDIyNi40NDNMNDIxLjQwOCA3ODUuMDg1TDQwOS45ODYgNzg1LjExNUw0MDkuOTk1IDQxNC4wOTdMNDEwIDI5MC40M0M0MTAuMDA2IDI3MC4zNTcgNDA5LjMyOSAyNDUuODg1IDQxMC4xNDIgMjI2LjE4NVoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTczMy42ODUgMjI2LjI2Nkw3NDAuMDggMjI2LjE2MUM3MzkuNDc1IDI2OS45NzUgNzM5Ljk2NSAzMTUuMDU3IDczOS45NSAzNTguOTQ0VjYyMy4yOEw3MzkuOTYgNzI4LjM2NUM3MzkuOTcgNzQ1LjgxIDc0MC42MiA3NjcuMzU1IDczOS44MyA3ODQuNDdDNzM4LjUyNSA3ODUuMzMgNzM3LjQ4NSA3ODUuMDMgNzM1LjYyNSA3ODUuMUw3MjguNjg1IDc4NS4xNDVDNzI4LjM0NSA3NjIuNDQgNzI4LjU5IDczOS4xNDUgNzI4LjU4IDcxNi40TDcyOC41NzUgNTg2LjlMNzI4LjU0NSAyMjYuMzg1TDczMy42ODUgMjI2LjI2NloiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTIzMy41MzMgMjI2LjExMkMyMzcuMjgxIDIyNi4yMDkgMjQxLjE2IDIyNi4xMDcgMjQ0LjkyMiAyMjYuMDU5QzI0NS41MDUgMjQ1Ljg1NyAyNDQuOTY2IDI2OC4zMjggMjQ0Ljk2NyAyODguMzQ3TDI0NC45NTkgNDExLjI3NUwyNDQuOTk4IDc4NS4wNjVMMjMzLjYzNyA3ODUuMDFDMjMzLjMxNyA3NjMuNjggMjMzLjU3MyA3NDEuNjEgMjMzLjU1OCA3MjAuMjE1TDIzMy41NjcgNTg5LjI5TDIzMy41MzMgMjI2LjExMloiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTM4NC44NDIgMjI2LjI0N0MzODYuNjAzIDIyNi4xNiAzODcuNjA0IDIyNS45MzMgMzg5LjE4OSAyMjYuNjk0QzM4OS43MTIgMjI5LjIyNyAzODkuNDYzIDIzNy4wNTkgMzg5LjQ2IDI0MC4wNjVMMzg5LjQ0NyAyNjYuNTkxVjM3MC45MzRMMzg5LjQ4OCA3ODUuMTJMMzgzLjYyNSA3ODUuMDdDMzgxLjkxMiA3ODUuMDggMzc5LjY4IDc4NS4zIDM3OC4yNjUgNzg0LjU0QzM3Ny43NDggNzc4LjkzIDM3OC4wMjUgNzY5LjU3IDM3OC4wMjggNzYzLjczTDM3OC4wNTggNzI1LjRMMzc4LjAzMiA2MDQuNzM1TDM3OC4xMzQgMjI2LjMzNUwzODQuODQyIDIyNi4yNDdaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik00MjYuMDc0IDIyNi40MzlMNDM3LjIzNiAyMjYuMzE1QzQzOC4wNDkgMjQ2LjI4OCA0MzcuNDM1IDI3MC44NTEgNDM3LjQ0IDI5MS4wNzJMNDM3LjQyNyA0MTQuMTU3TDQzNy40MTUgNzg1LjExTDQyNi4wMzEgNzg1LjA5NUw0MjYuMDc0IDIyNi40MzlaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik0yMTcuNjAxIDIyNi4yMzhMMjI5LjAyMiAyMjYuMDg3TDIyOC44NzEgNjQyLjcyQzIyOC44NSA2ODkuOTggMjI5LjMxMSA3MzcuOSAyMjguNzU2IDc4NS4wN0wyMTcuNTUzIDc4NS4wOUMyMTcuODkyIDc3MC4xNjUgMjE3LjU0MiA3NTMuOTMgMjE3LjU0MyA3MzguODdMMjE3LjU1MyA2NDUuOTZMMjE3LjUzMyAzNjcuNDY1TDIxNy41NSAyNzUuMDUxQzIxNy41NDMgMjU5LjgwNCAyMTYuOTg3IDI0MS4yNTUgMjE3LjYwMSAyMjYuMjM4WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNMjY1LjY5NSAyMjYuM0wyNzcuMDEyIDIyNi4zODJMMjc3LjAyNyA3ODUuMDY1TDI2NS42MTUgNzg1LjA3NUwyNjUuNjk1IDIyNi4zWiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNNzYwLjkyNSAyMjYuMDk4Qzc2NC45NTUgMjI3LjA4OCA3NzEuMDcgMjMwLjY5NSA3NzEuNzQ1IDIzNS4xNDFDNzcyLjczIDI0MS42NDUgNzcyLjQ2NSAyNDguNzEgNzcyLjQ2IDI1NS4zMDRMNzcyLjQzIDI4Ni4xMDlMNzcyLjQ0NSA0MDQuMThMNzcyLjQ0IDY1MS42Nkw3NzIuNDY1IDczMS44MkM3NzIuNDcgNzQ1LjI0NSA3NzIuNTMgNzU4Ljc5NSA3NzIuNDEgNzcyLjIyQzc3Mi4zNzUgNzc1Ljg3NSA3NzAuOTg1IDc3OC4xMiA3NjguOTI1IDc4MC45OTVDNzY1Ljk0IDc4My42MzUgNzY0LjYxIDc4NC4xMiA3NjAuOTM1IDc4NS4yNTVMNzYwLjkyNSAyMjYuMDk4WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNMzYyLjA5MiAyMjYuMjkzTDM3My40MjcgMjI2LjM4OUwzNzMuNDA1IDc4NS4wMDVMMzYyLjAyNiA3ODUuMDdMMzYyLjA5MiAyMjYuMjkzWiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNMjgxLjg0OCAyMjYuMTExTDI5My4xODggMjI2LjI4TDI5My4xMzQgNjY3LjEyNUwyOTMuMTYgNzQ2LjUzQzI5My4xNzIgNzUxLjM2IDI5My44MTcgNzgxLjM2NSAyOTIuNzAzIDc4NC44OUwyOTEuMTI1IDc4NS4wNDVIMjgxLjc5M0wyODEuODQ4IDIyNi4xMTFaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik02ODIuODg1IDIyNi4yNjZMNjkxLjYzIDIyNi4xMDRMNjkxLjYyNSA3ODUuMDM1TDY4My44NzUgNzg1LjA2QzY4Mi40OSA3ODUuMDg1IDY4MS44NjUgNzg1LjI2IDY4MC42OSA3ODQuNTlDNjgwLjYwNSA3ODMuOTY1IDY4MC41NCA3ODMuMzM1IDY4MC40OSA3ODIuNzA1QzY4MC4xNiA3NzguNzQ1IDY4MC4zOSA3NzEuMzI1IDY4MC4zOSA3NjcuMTM1TDY4MC40IDczNi4xOUw2ODAuMzc1IDYzNy40N0w2ODAuMjMgMzA5LjA0MUM2ODAuMjIgMjg2LjY3IDY4MC4wNzUgMjUwLjQ1MSA2ODAuMiAyMjcuMDUyQzY4MC4zOCAyMjYuODM1IDY4MC41NiAyMjYuNjE3IDY4MC43NCAyMjYuNEw2ODIuODg1IDIyNi4yNjZaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik0xMTQuNTQyIDIyNi4zNjdMMTE1LjM3MiAyMjYuNTk3QzExNS41NDggMjI2Ljg3OCAxMTUuNzI1IDIyNy4xNTkgMTE1LjkwMSAyMjcuNDRDMTE1Ljk5NyAyNTMuMjE0IDExNS45NDcgMzEwLjUwNSAxMTUuOTQyIDMzMi45MDdMMTE1LjkzNCA3ODUuNDc1QzExMy4wNDEgNzg0LjQwNSAxMTIuMjc0IDc4My45OCAxMDkuNjMxIDc4Mi40MzVDMTA3LjM2NiA3ODAuMjcgMTA0Ljc0OSA3NzYuNzYgMTA0LjY1NCA3NzMuNUMxMDQuMzI3IDc2Mi4yNyAxMDQuNDY4IDc1MC45ODUgMTA0LjQ3NCA3MzkuNzQ1TDEwNC40ODggNjczLjM0TDEwNC40ODIgMzM3LjY2OUwxMDQuNDkgMjcwLjMyMkMxMDQuNDkxIDI2Mi4zMTYgMTA0LjU0IDI1NC4wNTggMTA0LjQ5NSAyNDYuMDY5QzEwNC40MzQgMjM1LjIzNCAxMDQuMjIzIDIzMS43MjQgMTE0LjU0MiAyMjYuMzY3WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNNTgzLjg0NSAyMjYuMTFMNTk1LjIxNSAyMjYuMTY3QzU5NS4wOSAyNDkuMTYgNTk1LjA4NSAyNzIuMTU1IDU5NS4yMDUgMjk1LjE0OEw1OTUuMTggNDUxLjc1TDU5NS4yNTUgNzg0Ljk5NUM1OTIuMDA1IDc4NS4xNjUgNTg3LjM4NSA3ODUuMDI1IDU4NC4wMyA3ODUuMDM1TDU4My44NjUgNDI3LjM0OEw1ODMuODc1IDI5Mi4xMDZDNTgzLjg3NSAyNzEuMDA3IDU4My4xNiAyNDYuODY3IDU4My44NDUgMjI2LjExWiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNNjcyLjgzIDIyNi4yNDFDNjc0LjcyIDIyNi4xNzkgNjc0LjAwNSAyMjUuODUgNjc1LjMwNSAyMjYuNzE3QzY3NS43NyAyMzIuNDAyIDY3NS40ODUgMjQxLjY5IDY3NS40ODUgMjQ3LjU3OUw2NzUuNDc1IDI4NS40OTlMNjc1LjQ2IDQwNS4yMjVMNjc1LjUgNzg1LjAzTDY2NC45NiA3ODUuMTVDNjY0Ljg2NSA3ODUuMDU1IDY2NC43NSA3ODQuOTggNjY0LjY3NSA3ODQuODdDNjYzLjczIDc4My40OSA2NjQuMjIgMjczLjM3MSA2NjQuMDU1IDIyNi4zNEw2NzIuODMgMjI2LjI0MVoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTU1Mi4zNjUgMjI2LjI0MUM1NTUuODI1IDIyNi4zNTMgNTU5LjU3NSAyMjYuMjk4IDU2My4wNjUgMjI2LjMxMkw1NjMuMzUgNzg0Ljk5NUM1NTkuNzU1IDc4NS4xNCA1NTUuNiA3ODUuMDcgNTUxLjk1NSA3ODUuMUw1NTEuOTEgMzQ1LjEyNUw1NTEuODcgMjY2LjAxOEM1NTEuODYgMjYwLjk0NyA1NTEuMzE1IDIyOS41MTYgNTUyLjM2NSAyMjYuMjQxWiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNNjQ4LjAwNSAyMjYuMTE2TDY1OS40NiAyMjYuMDk5QzY1OC44MzUgMjcwLjk4NyA2NTkuMzg1IDMxNy4wMzMgNjU5LjM5IDM2Mi4wMjdMNjU5LjQ0IDYyMy42Mkw2NTkuNDUgNzM2LjE3TDY1OS40NiA3NjguOTNDNjU5LjQ2IDc3Mi42MyA2NTkuNzU1IDc4MS4zOSA2NTkuMzg1IDc4NC40OTVMNjU4LjU0IDc4NS4xTDY0OC4yMDUgNzg1LjExQzY0OC42ODUgNzU5LjIxIDY0OC4zMTUgNzMxLjY1NSA2NDguMjY1IDcwNS43MUw2NDguMTU1IDU3NC41NzVMNjQ4LjAwNSAyMjYuMTE2WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNNjE2LjAyNSAyMjYuMzk4TDYyNy4zNCAyMjYuMjczQzYyNi42OTUgMjUxLjk1OSA2MjcuMTQ1IDI4MC45OTcgNjI3LjI5NSAzMDYuODYzTDYyNy4yNjUgMzkxLjUxTDYyNy40IDc4Mi42MjVDNjI3LjM5IDc4My44NiA2MjcuNDYgNzgzLjQ1NSA2MjcuMDc1IDc4NC41OEM2MjQuNDc1IDc4NS42MyA2MTkuMTkgNzg1LjE0NSA2MTYuMjEgNzg1LjA0NUM2MTUuNjYgNzYzLjA4IDYxNi4xMjUgNzM4Ljg3IDYxNi4xMiA3MTYuODA1TDYxNi4wOTUgNTg2LjhMNjE2LjAyNSAyMjYuMzk4WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNNTM2LjM0NSAyMjYuMjQ0TDU0Ny4wNzUgMjI2LjI3MUM1NDYuNzU1IDI1My4wMjMgNTQ3LjExNSAyODAuNDcyIDU0Ny4xMSAzMDcuMzAzTDU0Ny4xNyA0ODQuMzM5TDU0Ny4zODUgNzg0LjM4TDU0Ny4wNDUgNzg0LjgzQzU0NS4xMSA3ODUuMzYgNTM4LjM4IDc4NS4xMyA1MzUuOTggNzg1LjExTDUzNS45MSAzNTAuNzk4TDUzNS44OSAyNjMuNDQ3QzUzNS44OCAyNTcuODEyIDUzNS40NyAyMjkuMjg1IDUzNi4zNDUgMjI2LjI0NFoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTUyMC4wNCAyMjYuMTIyTDUzMS4zOSAyMjYuMjI2QzUzMC42MDUgMjQyLjg5MyA1MzEuMjYgMjY0LjY4MSA1MzEuMTkgMjgxLjc3OUw1MzEuMzQgNDIxLjI5OEw1MzEuNDU1IDc4NC4wMzVDNTMxLjMzNSA3ODQuNjY1IDUzMS40NyA3ODQuMjkgNTMwLjc1IDc4NC45OTVDNTI3LjgxIDc4NS4zMzUgNTIzLjMwNSA3ODUuMTIgNTIwLjIyNSA3ODUuMDZDNTE5LjgyIDc2NS4xMiA1MjAuMTIgNzQ0LjE3NSA1MjAuMTA1IDcyNC4xN0w1MjAuMDg1IDYwNi44NUw1MjAuMDQgMjI2LjEyMloiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTQ3NC4wMTkgMjI2LjM0OEw0ODUuMzE2IDIyNi40MTNDNDg0Ljk3NCAyNDIuOTU5IDQ4NS4zMTYgMjYwLjk4NCA0ODUuMjgyIDI3Ny42ODFMNDg1LjI2MyA0MDUuNzVMNDg1LjMzIDc3OC44NzVDNDg1LjkzNyA3ODcuNzI1IDQ4MS40ODcgNzg1LjI0NSA0NzMuOTU2IDc4NS4wNkw0NzQuMDE5IDIyNi4zNDhaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik01NzUuOTc1IDIyNi4yNDFDNTc3LjQ2NSAyMjYuMTI5IDU3Ny41OCAyMjUuOTU1IDU3OC44NSAyMjYuNjMyQzU3OS4zNiAyMzAuMjQ1IDU3OS4wNiAyMzguODU5IDU3OS4wNTUgMjQyLjg3M0w1NzkuMDI1IDI3NS42OTFMNTc5LjA3IDM4OC4zODFMNTc5LjEzNSA3ODUuMDJMNTcwLjM3NSA3ODUuMDRDNTY4LjQ4IDc4NC45MTUgNTY5LjEyNSA3ODUuMzMgNTY4LjA2IDc4NC4yOEM1NjcuNjYgNzc4Ljc1NSA1NjcuOTQ1IDc2OS4zMSA1NjcuOTQ1IDc2My41OEw1NjcuOTE1IDcyNS43MTVMNTY3Ljg5NSA2MDMuNTNMNTY3LjcwNSAyMjYuMzE1TDU3NS45NzUgMjI2LjI0MVoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTY5Ni4yOTUgMjI2LjExNEw3MDcuODggMjI2LjE5NEM3MDcuMzggMjMzLjUyIDcwNy41NyAyNDIuODcgNzA3LjU2NSAyNTAuMzI3VjI4OS4zMjJMNzA3LjYgNDA5LjczM0w3MDcuNzk1IDc4Mi4xMjVDNzA3Ljc2IDc4My4wMTUgNzA3LjkzIDc4NC4xMTUgNzA3LjM3NSA3ODQuNTE1QzcwNS40ODUgNzg1Ljg5NSA2OTkuMDM1IDc4NS4xOTUgNjk2LjQ5IDc4NS4wNjVMNjk2LjQ2IDQ0My4wODlMNjk2LjQ2NSAzMDYuOTAyQzY5Ni41NyAyNzkuOTczIDY5Ni41MSAyNTMuMDQzIDY5Ni4yOTUgMjI2LjExNFoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTIxMS4zMSAyMjYuMjU0TDIxMi4yNjYgMjI2LjI3N0MyMTIuOTU0IDIyOC45MzIgMjEyLjcxMyAyNTYuOTk0IDIxMi43MTYgMjYwLjg1N0wyMTIuNjU5IDM2MC40OTVMMjEyLjY2IDc4NS4wNEwyMDUuODc1IDc4NS4wNDVDMjA0LjE2NSA3ODUuMTA1IDIwMy40MTggNzg1LjI2NSAyMDEuODEzIDc4NC42MjVDMjAxLjI4IDc4MS43MDUgMjAxLjUwOCA3NzIuOTU1IDIwMS41MDkgNzY5LjU5NUwyMDEuNTE1IDc0MC41NkwyMDEuNTE1IDYzMS4yOEwyMDEuNTMxIDIyNi4yNTRDMjA0Ljc4NCAyMjYuMzU1IDIwOC4wNTQgMjI2LjI4NyAyMTEuMzEgMjI2LjI1NFoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTYzNS45MjUgMjI2LjI2NEw2NDMuMzQgMjI2LjAzQzY0Mi44OTUgMjQwLjcyOCA2NDMuMTYgMjU2LjY1NyA2NDMuMTQ1IDI3MS40ODZMNjQzLjIxNSAzNjEuNzE0TDY0My4yNjUgNjM5LjMyTDY0My4zNTUgNzM3Ljg2TDY0My4zOCA3NjguMThDNjQzLjM4NSA3NzIuNjM1IDY0My42MDUgNzgwLjQ0IDY0My4yNCA3ODQuNjVMNjQyLjEyIDc4NS4wNTVDNjM4Ljg3IDc4NS4wOTUgNjM1LjU2IDc4NS4wNTUgNjMyLjMwNSA3ODUuMDU1TDYzMi4xMSA0MDguMzc2TDYzMi4wNiAyODcuNDc5TDYzMi4wMDUgMjQ5LjIwM0M2MzEuOTk1IDI0Mi4zOTUgNjMxLjc0IDIzMy41MzEgNjMyLjE5NSAyMjYuODU5QzYzMy41MjUgMjI2LjAyOCA2MzQuMDkgMjI2LjMyNCA2MzUuOTI1IDIyNi4yNjRaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik0zOTQuMDg5IDIyNi4xNTlDMzk3Ljg5NyAyMjYuMTYxIDQwMS43MDYgMjI2LjE0MSA0MDUuNTE0IDIyNi4wOTdMNDA1LjQ4OCA3ODUuMDZMMzk0LjA5OSA3ODUuMDlMMzk0LjA4OSAyMjYuMTU5WiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNNjAwIDIyNi4wNjdMNjExLjIwNSAyMjYuMzU5TDYxMS4yMiA1NzMuMTA1QzYxMS4zNiA2NDIuODM1IDYxMC4yNyA3MTQuMDE1IDYxMS40MyA3ODMuNjA1QzYxMS4zMyA3ODQuNTI1IDYxMS41MDUgNzg0LjA3NSA2MTAuNzI1IDc4NC44OEM2MDcuNyA3ODUuMzY1IDYwMy4zMDUgNzg1LjE5NSA2MDAuMTMgNzg1LjE3NUw2MDAgMjI2LjA2N1oiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTQ1OC4xNzggMjI2LjAzQzQ2MS44OTMgMjI2LjI1OCA0NjUuNzY5IDIyNi4yOTQgNDY5LjUwNSAyMjYuMzgxTDQ2OS40NjYgNzg1LjA5NUM0NjUuNzI2IDc4NS4wMiA0NjEuNzk3IDc4NS4wOCA0NTguMDQgNzg1LjA3TDQ1OC4xNzggMjI2LjAzWiIgZmlsbD0iIzFEMUMxQyIvPgo8cGF0aCBkPSJNMTg1LjM4OCAyMjYuMzIxQzE4OS4wNTEgMjI2LjI2NCAxOTIuODQ2IDIyNi4zMTYgMTk2LjUyMSAyMjYuMzE2QzE5Ny4zMzggMjk1LjAyMSAxOTYuNTMzIDM2NS4zMzMgMTk2LjUzMSA0MzQuMTYxTDE5Ni41NDQgNzg1LjA0TDE4NS40MjEgNzg1LjAxNUwxODUuMzg4IDIyNi4zMjFaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik01MDguMDcgMjI2LjI0TDUxNS40NiAyMjYuMDc0TDUxNS40NSA2MDcuNTY1TDUxNS40NTUgNzI0LjI1TDUxNS41MSA3NjIuMTY1QzUxNS41MiA3NjkgNTE1Ljc2NSA3NzcuNzUgNTE1LjMxNSA3ODQuNDQ1QzUxNC40MjUgNzg1LjMwNSA1MTQuMjYgNzg1LjAwNSA1MTIuNjI1IDc4NS4wOEw1MDQuOTcgNzg1LjA1QzUwNC4xOTUgNzc1LjI4IDUwNC41OSA3NjAuMjEgNTA0LjYxNSA3NTAuMTZMNTA0LjYxIDY5NS45NTVMNTA0LjU3NSA1MTYuNDY1TDUwNC42MTUgMzE5LjAzNkw1MDQuNTg1IDI2MC4yNjVDNTA0LjU1NSAyNTAuNTcgNTA0LjEwNSAyMzYuMjgzIDUwNC43MSAyMjcuMDczQzUwNS45MjUgMjI1Ljk1OCA1MDUuOTA1IDIyNi4zNDEgNTA4LjA3IDIyNi4yNFoiIGZpbGw9IiMxRDFDMUMiLz4KPHBhdGggZD0iTTQ5MC4wMzkgMjI2LjMwNkM0OTMuMzM0IDIyNi4zODMgNDk2Ljc4NSAyMjYuMzQ2IDUwMC4wOTUgMjI2LjM2TDUwMC4wMzUgNzg1LjA5TDQ4OS45NjcgNzg1LjA1NUw0OTAuMDM5IDIyNi4zMDZaIiBmaWxsPSIjMUQxQzFDIi8+CjxwYXRoIGQ9Ik05MjguNjQ1IDE4MS42MjZDOTM3Ljc1IDE4My43NDggOTM5LjE1NSAxOTAuNzk4IDkzOS4yODUgMTk4Ljg1MUM5MzkuNTEgMjEyLjU1NSA5MzkuNDQ1IDIyNi4yNiA5MzkuNDQ1IDIzOS45NjdMOTM5LjQzNSAzMTMuNzQ0TDkzOS40NiA1NDAuNDNMOTM5LjQ3IDcyMi40NDVMOTM5LjQ4IDc4MS45NTVDOTM5LjQ4IDc5Mi4yMjUgOTM5LjU1IDgwMi41OSA5MzkuNCA4MTIuODE1QzkzOS4zMiA4MTguMTA1IDkzNi44IDgyMy41NjUgOTMxLjg4IDgyNS43NkM5MjYuNTY1IDgyOC4xMzUgOTE4Ljg4IDgyNy40OSA5MTMuMTI1IDgyNy40NUw5MDIuMTY1IDgyNy41MDVDOTAzLjAyIDc5MC43NyA5MDIuMzkgNzUxLjA0NSA5MDIuMzQ1IDcxNC4xNjVMOTAyLjM3NSA1MzQuMzY1TDkwMi4zNjUgNDY1LjYyNUM5MDIuMzcgNDMyLjA5NCA5MDEuMDkgNDA0LjU3NCA5MTQuMTc1IDM3Mi45MzdDOTE5LjIgMzYwLjc4NiA5MjUuMzQ1IDM0My4wMDkgOTI3LjI4NSAzMzAuMTQ4QzkyOS44MDUgMzEzLjQ3OSA5MjguNjkgMjk0LjE4OSA5MjguNjg1IDI3Ny4wNzNMOTI4LjY0NSAxODEuNjI2WiIgZmlsbD0iIzMxMzIzMiIvPgo8cGF0aCBkPSJNOTEyLjk2NSAxODEuNTQxTDkyMi41NyAxODEuNDg3TDkyMi41MyAyNzEuNTQ4QzkyMi41NCAyODcuNjQ3IDkyMy41MDUgMzE0LjA5NyA5MjAuOTI1IDMyOC43MzNDOTE1LjQgMzYwLjA2OCA4OTguMTQgMzg1LjQ4MSA4OTYuNjUgNDE4LjcxQzg5NS43NzUgNDM4LjE4NyA4OTUuOTQgNDU2LjQwNyA4OTUuOTUgNDc1Ljg3Mkw4OTUuOTYgNTU4LjY4TDg5NS45OCA4MjcuNDg1TDg3OS40OCA4MjcuNDY1TDg2OS40MDUgODI3LjQ3NUw4NjkuMzcgNTUzLjAzTDg2OS4zNjUgNDY1LjY4MkM4NjkuMzY1IDQ1MS4wNyA4NjguODU1IDQzMi4xIDg2OS45OTUgNDE3LjcyNEM4NzEuNzk1IDM5NS4wNDIgODkwLjU1NSAzNjguODgzIDkwMC40OCAzNDguMzE1QzkwMy42NzUgMzQxLjU3OSA5MDkuMTUgMzMyLjg4NCA5MTAuNzEgMzI1LjYzMUM5MTQuMzMgMzA4Ljc5OSA5MTIuNjg1IDI4OC41MTEgOTEyLjg4NSAyNzEuMjc0QzkxMy4yMjUgMjQxLjMwNiA5MTIuNjI1IDIxMS40MzkgOTEyLjk2NSAxODEuNTQxWiIgZmlsbD0iIzMxMzIzMiIvPgo8cGF0aCBkPSJNNzkzLjc0NSAxODEuNDg5TDgwMy40OTUgMTgxLjQ3M0w4MDMuNTA1IDI1OC40ODVDODAzLjUxIDI3My4zOTcgODAyLjE1NSAzMTUuMDkgODA2LjMgMzI2Ljg3MUM4MTUuNzkgMzUzLjg0MyA4NDEuMTY1IDM4NS4wNzMgODQ2LjA2IDQxNC4wNEM4NDcuNDU1IDQyMi4yODIgODQ3LjE5NSA0MzcuOTEzIDg0Ny4yMSA0NDYuNjk4TDg0Ny4yMjUgNDkxLjU2NUw4NDcuMTY1IDY0MS4xM0w4NDcuMjMgNzc4LjIxNUM4NDcuMjQgNzg2LjA3IDg0OC4yNTUgODIyLjA2IDg0Ni44ODUgODI3LjE5TDg0NS42MjUgODI3LjQ1NUw4MjAuNyA4MjcuNDc1QzgyMS4yMzUgNzk1Ljc3IDgyMC43MzUgNzYyLjQ3NSA4MjAuNyA3MzAuNjg1TDgyMC43ODUgNTgzLjA2NUw4MjAuNzYgNDg3LjQwM0M4MjAuOCA0NjQuNjUzIDgyMC45NCA0NDIuMjg1IDgxOS45MzUgNDE5LjU5M0M4MTguOTcgMzg3LjQ2IDgwMC44OCAzNTkuMjg5IDc5NS41OTUgMzI4LjQwN0M3OTIuNzIgMzExLjYwNyA3OTMuODc1IDI4OS40MzUgNzkzLjg1NSAyNzIuMDA4TDc5My43NDUgMTgxLjQ4OVoiIGZpbGw9IiMzMTMyMzIiLz4KPHBhdGggZD0iTTg1NS41NTUgMjM4Ljk4MUM4NTcuMDEgMjQwLjY5IDg1Ni40NDUgMjQ4Ljk5MyA4NTYuNDE1IDI1MS44MzVDODUxLjkwNSAyNTUuMjY1IDg0My43NTUgMjU5LjYyNCA4MzguNTE1IDI2Mi45MjhWMjg2LjA5N0M4NDIuNjg1IDI4OC45MzQgODUzLjk1NSAyOTUuMzMyIDg1OC40NTUgMjk3LjU0OEM4NjQuMjYgMjk0Ljc2NiA4NzEuMzMgMjkwLjMzMyA4NzcgMjg2Ljk2OEM4ODAuOTA1IDI4OS4yMTQgODg0LjUwNSAyOTEuMzA3IDg4OC4zMSAyOTMuNzU1Qzg4NC45NDUgMjk2LjQzNyA4ODEuMTc1IDI5OC40OTEgODc3LjQ2IDMwMC42NkM4NzIuNDc1IDMwMy41ODMgODYyLjE2NSAzMTEuMzg2IDg1Ny40NyAzMTAuMTk0Qzg1Mi40MDUgMzA4LjkwNyA4MjkuNTU1IDI5NS42NjYgODI3LjQ4NSAyOTIuMzIzQzgyNS42OSAyODkuNDE3IDgyNi4wNiAyNjEuNjkxIDgyNy4xIDI1Ny43ODNDODI4LjIyIDI1My41NjcgODUwLjMxIDI0MS45OTIgODU1LjU1NSAyMzguOTgxWiIgZmlsbD0iI0ZFRTFBMyIvPgo8cGF0aCBkPSJNODYxLjAyIDIzOC43MzRDODY1LjE1IDI0MC42ODQgODg0Ljg4IDI1Mi42NDQgODg4LjQyIDI1NS40ODFDODkxLjgxIDI1OC4yMDIgODkwLjQ3IDI4My4wODUgODkwLjI3IDI4OC44OTVDODg4LjE0NSAyODkuMTMyIDg4MC44NDUgMjg0LjI2MiA4NzguNTMgMjgyLjg1OEM4NzguNDI1IDI3Ni4zNDIgODc4LjQ5IDI2OS42NDUgODc4LjQ3IDI2My4xMTNDODc0LjA0NSAyNTkuODg3IDg2NS45MzUgMjU1LjYwMiA4NjAuODI1IDI1Mi4zODhDODYwLjgzIDI0Ny44MzYgODYwLjg5NSAyNDMuMjg0IDg2MS4wMiAyMzguNzM0WiIgZmlsbD0iI0ZFRTFBMyIvPgo8cGF0aCBkPSJNMTYyLjU4NSA4MzYuNDQ1TDI2MC42NDMgODM2LjQ2NUwyNTMuMzY5IDg0NS4wMDVDMjUxLjUyOSA4NDcuNTUgMjQ5LjI2NiA4NTAuOTIgMjQ1LjgxMSA4NTEuMTM1QzIzNi41NzIgODUxLjcwNSAyMjcuMTU1IDg1MS4zNyAyMTcuODgxIDg1MS4zNUMyMDAuNDc0IDg1MS40MzUgMTgzLjA2NyA4NTEuNDIgMTY1LjY2IDg1MS4zQzE2NC41MzggODQ3LjA1NSAxNjMuNDg0IDg0MC44OCAxNjIuNTg1IDgzNi40NDVaIiBmaWxsPSIjMzEzMjMyIi8+CjxwYXRoIGQ9Ik03NjMuMzMgODM2LjQwNUw4NjEuNDM1IDgzNi40M0M4NjAuNjQ1IDg0MC43NjUgODU5Ljc0NSA4NDUuMDggODU4Ljc0IDg0OS4zN0w4NTguMjIgODUwLjc3Qzg1Ni43ODUgODUxLjgyNSA4NDIuMjIgODUxLjQwNSA4MzkuMzM1IDg1MS40MDVMNzk5LjU4IDg1MS40NDVDNzkyLjgyNSA4NTEuNDQ1IDc4Mi4yMTUgODUxLjczIDc3NS43MzUgODUwLjg3Qzc3Mi43MyA4NDguMDQ1IDc2Ni4zMiA4MzkuOTIgNzYzLjMzIDgzNi40MDVaIiBmaWxsPSIjMzEzMjMyIi8+Cjwvc3ZnPgo=';

const LOGO_SVG_CX = 858;
const LOGO_SVG_CY = 275;

const hpImg = new Image();
hpImg.src = HEATPUMP_SVG;
let hpImgLoaded = false;
hpImg.onload = () => { hpImgLoaded = true; };

/**
 * Energie is heating-only. On mount we force `heizen`.
 */
export function mountEnergie(): ModeView {
  const s0 = store.get();
  if (s0.energieMode !== 'heizen' || s0.hpState !== 'heat') {
    store.set({ energieMode: 'heizen', hpState: 'heat' });
  }

  const hero = buildHero();
  const captionEl = document.createElement('div');
  captionEl.className = 'mode-caption';
  const control = buildControl();

  const render = (s: KioskState): void => {
    const row = pickRow(s.heatTempC);
    const dict = t(s.lang);
    captionEl.textContent = dict.energie.caption;
    hero.update(row, dict);
    control.update(s, row, dict);
  };

  const unsub = store.subscribe(render);
  render(store.get());

  return {
    hero: hero.el,
    caption: captionEl,
    control: control.el,
    destroy() { unsub(); hero.destroy(); },
  };
}

/* ============================================================
   Hero — canvas scene (draws EVERYTHING including the unit SVG)
         + DOM stat overlays that sit around the canvas
   ============================================================ */
function buildHero() {
  const el = document.createElement('div');
  el.className = 'energie-hero';

  /* --- Scene: fixed-height box that holds canvas + canvas-anchored overlays --- */
  const scene = document.createElement('div');
  scene.className = 'energie-scene';
  el.appendChild(scene);

  const canvas = document.createElement('canvas');
  canvas.className = 'energie-canvas';
  scene.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  // Strom label — top center, anchored to the scene
  const elecOv = document.createElement('div');
  elecOv.className = 'energie-elec';
  const elecLabel = document.createElement('div');
  elecLabel.className = 'energie-elec__label';
  const elecVal = document.createElement('div');
  elecVal.className = 'energie-elec__val';
  elecOv.append(elecLabel, elecVal);
  scene.appendChild(elecOv);

  // AUSSENLUFT label — top-left, anchored to the scene
  const aussen = document.createElement('div');
  aussen.className = 'energie-aussenluft';
  scene.appendChild(aussen);

  /* --- Stats row: absolute-positioned overlay at the bottom of the scene
         so it always lives inside the canvas area the kiosk shell allots. */
  const statsRow = document.createElement('div');
  statsRow.className = 'energie-stats-row';
  scene.appendChild(statsRow);

  // Air stat — bottom-left overlay
  const airStat = document.createElement('div');
  airStat.className = 'energie-stat-block energie-stat-block--air';
  const airLabel = document.createElement('div');
  airLabel.className = 'energie-stat__label';
  const airNum = document.createElement('div');
  airNum.className = 'energie-stat__num';
  const airUnit = document.createElement('div');
  airUnit.className = 'energie-stat__unit';
  airStat.append(airLabel, airNum, airUnit);
  statsRow.appendChild(airStat);

  // Heat stat — bottom-right overlay + COP badge
  const heatStat = document.createElement('div');
  heatStat.className = 'energie-stat-block energie-stat-block--heat';
  const heatLabelEl = document.createElement('div');
  heatLabelEl.className = 'energie-stat__label';
  const heatNum = document.createElement('div');
  heatNum.className = 'energie-stat__num';
  const heatUnit = document.createElement('div');
  heatUnit.className = 'energie-stat__unit';
  const copBadge = document.createElement('div');
  copBadge.className = 'energie-cop-badge';
  heatStat.append(heatLabelEl, heatNum, heatUnit, copBadge);
  statsRow.appendChild(heatStat);

  /* ----- canvas state ----- */
  let W = 0, H = 0;
  let displayCOP = 5.01, currentCOP = 5.01;
  let houseWarmth = 0, rafId = 0;
  let airPath: Pt[] = [], heatPaths: Pt[][] = [], elecPath: Pt[] = [];
  // Latest i18n dict — drawBar() pulls labels from here so the canvas-drawn
  // bar respects DE/EN toggling. Updated via the hero's update() callback.
  let currentDict: Dict | null = null;

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = scene.getBoundingClientRect();
    W = rect.width; H = rect.height;
    if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPaths();
  }

  /*
   * Paths — EXACT copy from the working HTML prototype.
   * cy = H × 0.68 because the unit SVG is drawn on canvas at that point.
   * No CSS photo overlay = no alignment mismatch.
   */
  function buildPaths(): void {
    const cx = W * 0.5, cy = H * 0.50;
    const uhw = W * 0.04, uhh = H * 0.10;

    airPath = [
      { x: -10, y: cy },
      { x: W * 0.13, y: cy - 10 },
      { x: W * 0.30, y: cy + 6 },
      { x: cx - uhw - 8, y: cy },
    ];

    const houseX = W * 0.88;
    const houseS = Math.min(50, W * 0.05);
    const houseWallLeft = houseX - houseS * 0.9;
    heatPaths = [];
    for (let i = 0; i < 5; i++) {
      const spread = i / 4;
      const sy = cy + (spread - 0.5) * uhh * 1.6;
      const ey = H * 0.50 + (spread - 0.5) * houseS * 1.2;
      heatPaths.push([
        { x: cx + uhw + 8, y: sy },
        { x: W * 0.62, y: sy + (ey - sy) * 0.35 },
        { x: W * 0.75, y: ey },
        { x: houseWallLeft - 2, y: ey },
      ]);
    }

    elecPath = [
      { x: cx, y: 36 },
      { x: cx, y: H * 0.22 },
      { x: cx, y: cy - uhh - 6 },
    ];
  }

  /* --- Bezier math --- */
  function bz(pts: Pt[], tt: number): Pt {
    if (pts.length === 4) {
      const [p0, p1, p2, p3] = pts as [Pt, Pt, Pt, Pt];
      const a = 1 - tt;
      return {
        x: a*a*a*p0.x + 3*a*a*tt*p1.x + 3*a*tt*tt*p2.x + tt*tt*tt*p3.x,
        y: a*a*a*p0.y + 3*a*a*tt*p1.y + 3*a*tt*tt*p2.y + tt*tt*tt*p3.y,
      };
    }
    const [p0, p1, p2] = pts as [Pt, Pt, Pt];
    const a = 1 - tt;
    return {
      x: a*a*p0.x + 2*a*tt*p1.x + tt*tt*p2.x,
      y: a*a*p0.y + 2*a*tt*p1.y + tt*tt*p2.y,
    };
  }

  function sp(pts: Pt[]): void {
    ctx.beginPath(); ctx.moveTo(pts[0]!.x, pts[0]!.y);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1]!.x, pts[1]!.y, pts[2]!.x, pts[2]!.y);
    else ctx.bezierCurveTo(pts[1]!.x, pts[1]!.y, pts[2]!.x, pts[2]!.y, pts[3]!.x, pts[3]!.y);
    ctx.stroke();
  }

  function ease(tt: number): number {
    return tt < 0.5 ? 4*tt*tt*tt : 1 - Math.pow(-2*tt + 2, 3) / 2;
  }

  /* --- Air wisps --- */
  function drawAirFlow(time: number): void {
    const cx = W * 0.5, cy = H * 0.50;
    const endX = cx - W * 0.04 - 8;
    ctx.strokeStyle = 'rgba(180,210,240,0.03)'; ctx.lineWidth = 3; sp(airPath);
    for (let w = 0; w < 4; w++) {
      const baseY = cy + (w / 3 - 0.5) * 35;
      const freq = 0.008 + w * 0.002, amp = 6 + w * 3, ph = w * 1.7;
      const wa = 0.12 + 0.06 * Math.sin(time * 0.0008 + w);
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) {
        const f = s / 40, x = -10 + (endX + 10) * f;
        const c = f * f * f;
        const y = (baseY + (cy - baseY) * c) + Math.sin(-time * freq + f * 12 + ph) * amp * (1 - c * 0.8);
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(180,215,245,${wa})`;
      ctx.lineWidth = 1.2 + Math.sin(time * 0.001 + w) * 0.3;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = `rgba(160,200,235,${wa * 0.25})`; ctx.lineWidth = 5; ctx.stroke();
    }
  }

  /* --- White electricity --- */
  function drawElec(time: number): void {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1.5; sp(elecPath);
    for (let p = 0; p < 2; p++) {
      const dur = 3800, raw = ((time + p * dur * 0.5) % dur) / dur;
      const e = ease(raw), head = -0.05 + e * 1.15, tail = head - 0.30;
      const dH = Math.min(1, Math.max(0, head)), dT = Math.min(1, Math.max(0, tail));
      if (dH - dT < 0.01) continue;
      const alpha = ((dH - dT) / 0.30) * Math.max(0, Math.min(1, head / 0.12)) * Math.max(0, Math.min(1, (1.05 - head + 0.30) / 0.15));
      const pts: Pt[] = [];
      for (let s = 0; s <= 16; s++) pts.push(bz(elecPath, Math.min(dT + (dH - dT) * (s / 16), 0.999)));
      const first = pts[0]!, last = pts[pts.length - 1]!;
      const trace = (): void => { ctx.beginPath(); ctx.moveTo(first.x, first.y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y); };
      trace(); ctx.strokeStyle = `rgba(220,225,235,${alpha * 0.12})`; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
      trace(); ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`; ctx.lineWidth = 2; ctx.stroke();
      const g = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 8);
      g.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`); g.addColorStop(0.5, `rgba(220,225,240,${alpha * 0.15})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(last.x, last.y, 8, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* --- Heat pulse --- */
  function heatPulse(pts: Pt[], head: number, tail: number, maxA: number): void {
    if (maxA < 0.005) return;
    const dH = Math.min(1, Math.max(0, head)), dT = Math.min(1, Math.max(0, tail));
    if (dH - dT < 0.005) return;
    const pl = head - tail;
    const alpha = maxA * ((dH - dT) / Math.max(pl, 0.01)) * Math.max(0, Math.min(1, head / 0.12)) * Math.max(0, Math.min(1, (1.05 - head + pl) / 0.15));
    const points: Pt[] = [];
    for (let s = 0; s <= 24; s++) points.push(bz(pts, Math.min(dT + (dH - dT) * (s / 24), 0.999)));
    const first = points[0]!, last = points[points.length - 1]!;
    const trace = (): void => { ctx.beginPath(); ctx.moveTo(first.x, first.y); for (let i = 1; i < points.length; i++) ctx.lineTo(points[i]!.x, points[i]!.y); };
    trace(); ctx.strokeStyle = `rgba(232,146,12,${alpha*0.08})`; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    trace(); ctx.strokeStyle = `rgba(232,146,12,${alpha*0.25})`; ctx.lineWidth = 8; ctx.stroke();
    trace(); ctx.strokeStyle = `rgba(255,180,40,${alpha*0.6})`; ctx.lineWidth = 3; ctx.stroke();
    trace(); ctx.strokeStyle = `rgba(255,245,220,${alpha*0.5})`; ctx.lineWidth = 1.2; ctx.stroke();
    const g1 = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 18);
    g1.addColorStop(0, `rgba(232,146,12,${alpha*0.35})`); g1.addColorStop(1, 'rgba(232,146,12,0)');
    ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(last.x, last.y, 18, 0, Math.PI * 2); ctx.fill();
    const g2 = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 5);
    g2.addColorStop(0, `rgba(255,250,230,${alpha*0.7})`); g2.addColorStop(0.6, `rgba(255,200,80,${alpha*0.2})`); g2.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(last.x, last.y, 5, 0, Math.PI * 2); ctx.fill();
  }

  /* --- All flows --- */
  function drawFlows(time: number): void {
    displayCOP += (currentCOP - displayCOP) * 0.04;
    const full = Math.min(5, Math.floor(displayCOP));
    const frac = displayCOP - Math.floor(displayCOP);
    const partial = full < 5 && frac > 0.5 ? full : -1;
    const partialB = partial >= 0 ? (frac - 0.5) * 2 : 0;
    drawAirFlow(time); drawElec(time);
    let total = 0;
    for (let i = 0; i < 5; i++) {
      const pts = heatPaths[i]!;
      let b = i < full ? 1 : i === partial ? partialB : 0;
      total += b;
      ctx.strokeStyle = `rgba(232,146,12,${b > 0.01 ? 0.04 : 0.015})`; ctx.lineWidth = 2; sp(pts);
      if (b < 0.01) continue;
      const dur = 4200 + i * 300;
      for (let p = 0; p < 2; p++) {
        const raw = ((time + i * 700 + p * dur * 0.5) % dur) / dur;
        const head = -0.08 + ease(raw) * 1.22;
        heatPulse(pts, head, head - 0.30, b);
      }
      const amb = b * (0.4 + 0.18 * Math.sin(time * 0.0012 + i * 1.3));
      ctx.strokeStyle = `rgba(232,146,12,${amb * 0.25})`; ctx.lineWidth = 2; ctx.lineCap = 'round'; sp(pts);
      ctx.strokeStyle = `rgba(232,146,12,${amb * 0.05})`; ctx.lineWidth = 12; sp(pts);
    }
    houseWarmth += (total - houseWarmth) * 0.06;
  }

  /* --- Draw heat pump SVG on canvas + logo glow --- */
  function drawUnit(time: number): void {
    const cx = W * 0.5, cy = H * 0.50;
    const imgH = H * 0.40, imgW = imgH;
    const imgX = cx - imgW / 2, imgY = cy - imgH / 2;
    const pulse = 0.25 + 0.1 * Math.sin(time * 0.002);
    const glowR = imgW * 0.5;
    const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    gg.addColorStop(0, `rgba(232,146,12,${pulse})`); gg.addColorStop(0.6, `rgba(232,146,12,${pulse * 0.3})`); gg.addColorStop(1, 'rgba(232,146,12,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();
    if (hpImgLoaded) ctx.drawImage(hpImg, imgX, imgY, imgW, imgH);
    const lx = imgX + (LOGO_SVG_CX / 1024) * imgW, ly = imgY + (LOGO_SVG_CY / 1024) * imgH;
    const ls = imgW * 0.035, lp = 0.7 + 0.3 * Math.sin(time * 0.003);
    const lg1 = ctx.createRadialGradient(lx, ly, 0, lx, ly, ls * 5);
    lg1.addColorStop(0, `rgba(254,225,163,${0.25*lp})`); lg1.addColorStop(0.5, `rgba(232,170,40,${0.08*lp})`); lg1.addColorStop(1, 'rgba(232,146,12,0)');
    ctx.fillStyle = lg1; ctx.beginPath(); ctx.arc(lx, ly, ls * 5, 0, Math.PI * 2); ctx.fill();
    const lg2 = ctx.createRadialGradient(lx, ly, 0, lx, ly, ls * 2.5);
    lg2.addColorStop(0, `rgba(255,240,200,${0.35*lp})`); lg2.addColorStop(0.6, `rgba(254,225,163,${0.12*lp})`); lg2.addColorStop(1, 'rgba(254,225,163,0)');
    ctx.fillStyle = lg2; ctx.beginPath(); ctx.arc(lx, ly, ls * 2.5, 0, Math.PI * 2); ctx.fill();
    const lg3 = ctx.createRadialGradient(lx, ly, 0, lx, ly, ls * 1.2);
    lg3.addColorStop(0, `rgba(255,252,240,${0.4*lp})`); lg3.addColorStop(0.5, `rgba(255,235,180,${0.15*lp})`); lg3.addColorStop(1, 'rgba(255,225,163,0)');
    ctx.fillStyle = lg3; ctx.beginPath(); ctx.arc(lx, ly, ls * 1.2, 0, Math.PI * 2); ctx.fill();
  }

  /* --- House --- */
  function drawHouse(time: number): void {
    const hx = W * 0.88, hy = H * 0.50, s = Math.min(50, W * 0.05);
    const w = Math.min(1, houseWarmth / 5), breathe = 0.85 + 0.15 * Math.sin(time * 0.0015);
    const gr = s * (2 + w * 2), ga = w * 0.4 * breathe;
    if (ga > 0.005) {
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, gr);
      g.addColorStop(0, `rgba(232,146,12,${ga})`); g.addColorStop(0.4, `rgba(232,146,12,${ga * 0.3})`); g.addColorStop(1, 'rgba(232,146,12,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, gr, 0, Math.PI * 2); ctx.fill();
    }
    const la = 0.25 + w * 0.2 + 0.04 * Math.sin(time * 0.0018);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const rp = hy - s, eY = hy - s * 0.15;
    ctx.strokeStyle = `rgba(232,232,225,${la})`; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(hx - s * 1.22, eY); ctx.lineTo(hx, rp); ctx.lineTo(hx + s * 1.22, eY); ctx.stroke();
    const wl = hx - s * 0.9, wr = hx + s * 0.9, fl = hy + s * 0.85;
    ctx.beginPath(); ctx.moveTo(wl, eY); ctx.lineTo(wl, fl); ctx.lineTo(wr, fl); ctx.lineTo(wr, eY); ctx.stroke();
    if (w > 0.05) { ctx.fillStyle = `rgba(232,146,12,${w * 0.08 * breathe})`; ctx.beginPath(); ctx.moveTo(wl, eY); ctx.lineTo(wl, fl); ctx.lineTo(wr, fl); ctx.lineTo(wr, eY); ctx.closePath(); ctx.fill(); }
    const dw = s * 0.28, dh = s * 0.55, dx = hx - dw / 2, dy = fl - dh;
    ctx.fillStyle = `rgba(232,146,12,${0.12 + w * 0.4 + 0.08 * Math.sin(time * 0.002)})`; ctx.beginPath(); ctx.roundRect(dx, dy, dw, dh, [4, 4, 0, 0]); ctx.fill();
    const ws = s * 0.22, wy = eY + s * 0.18, wa = 0.06 + w * 0.3 + 0.04 * Math.sin(time * 0.0022 + 1);
    ctx.fillStyle = `rgba(232,180,60,${wa})`; ctx.fillRect(wl + s * 0.2, wy, ws, ws);
    ctx.strokeStyle = `rgba(232,232,225,${la * 0.5})`; ctx.lineWidth = 1; ctx.strokeRect(wl + s * 0.2, wy, ws, ws);
    ctx.fillStyle = `rgba(232,180,60,${wa})`; ctx.fillRect(wr - s * 0.2 - ws, wy, ws, ws); ctx.strokeRect(wr - s * 0.2 - ws, wy, ws, ws);
    const cx2 = hx + s * 0.4, cw = s * 0.18, ct = rp + s * 0.15;
    const rf = (cx2 - hx) / (s * 1.1), ry = rp + (eY - rp) * rf;
    ctx.strokeStyle = `rgba(232,232,225,${la * 0.4})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx2 - cw / 2, ry); ctx.lineTo(cx2 - cw / 2, ct); ctx.lineTo(cx2 + cw / 2, ct); ctx.lineTo(cx2 + cw / 2, ry); ctx.stroke();
  }

  /* --- Multiplier bar drawn directly on canvas (no DOM, no clipping). --- */
  function drawBar(): void {
    const barH = 28;
    const barY = H - barH - 28;
    const barX = 32;
    const barW = W - 64;
    const radius = 6;
    if (barW <= 0) return;

    const cop = Math.max(1, displayCOP);
    const eWidth = (1 / cop) * barW;
    const air = Math.max(0, displayCOP - 1);

    // Orange background (full width)
    ctx.fillStyle = 'rgba(232,146,12,0.9)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, radius);
    ctx.fill();

    // White electricity segment (left)
    if (eWidth > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, eWidth, barH, [radius, 0, 0, radius]);
      ctx.fill();
    }

    // Labels — pulled from the latest i18n dict so DE/EN toggle still works.
    const d = currentDict?.energie;
    const elecLabel = d ? `${d.electricityIn} ${d.electricityLabel}` : '1 kWh Strom';
    const airLabel = d ? d.airBarLabel(air.toFixed(2)) : `+ ${air.toFixed(2)} kWh Luft`;

    ctx.fillStyle = 'rgba(12,12,14,0.9)';
    ctx.font = '600 10px "Inter", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(elecLabel, barX + 10, barY + barH / 2);
    ctx.textAlign = 'right';
    ctx.fillText(airLabel, barX + barW - 10, barY + barH / 2);

    // Legend below bar
    const legendY = barY + barH + 12;
    ctx.font = '400 9px "Inter", sans-serif';
    const ccx = W / 2;
    const paid = d?.paidElectricity ?? 'Bezahlter Strom';
    const free = d?.freeEnvEnergy ?? 'Gratis Umweltenergie';

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(ccx - 80, legendY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(122,120,114,0.8)';
    ctx.textAlign = 'left';
    ctx.fillText(paid, ccx - 74, legendY + 1);

    ctx.fillStyle = 'rgba(232,146,12,0.9)';
    ctx.beginPath(); ctx.arc(ccx + 30, legendY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(122,120,114,0.8)';
    ctx.fillText(free, ccx + 36, legendY + 1);
  }

  /* --- Render loop --- */
  function loop(time: number): void {
    if (W > 0 && H > 0) {
      ctx.clearRect(0, 0, W, H);
      drawFlows(time);
      drawUnit(time);
      drawHouse(time);
      drawBar();
    }
    rafId = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(scene);
  rafId = requestAnimationFrame(loop);

  return {
    el,
    update(row: CopRow, dict: Dict) {
      currentCOP = row.cop;
      currentDict = dict;
      aussen.textContent = dict.energie.outsideAirLabel.toUpperCase();
      elecLabel.textContent = dict.energie.electricityLabel.toUpperCase();
      elecVal.textContent = `⚡ ${dict.energie.electricityIn}`;
      airLabel.textContent = dict.energie.fromAirLabel.toUpperCase();
      const air = Math.max(0, row.cop - 1);
      airNum.textContent = `+${fmt(air)}`;
      airUnit.innerHTML = `kWh — <span class="energie-stat__free">${dict.energie.free}</span>`;
      heatLabelEl.textContent = dict.energie.heatLabel.toUpperCase();
      heatNum.textContent = fmt(row.cop);
      heatUnit.textContent = dict.energie.heatOut;
      copBadge.innerHTML = `${dict.energie.cop} <span class="energie-cop-badge__val">${fmt(row.cop)}</span>`;
    },
    destroy() { cancelAnimationFrame(rafId); ro.disconnect(); },
  };
}

/* ============================================================
   Control — multiplier bar + temperature slider with detents
   ============================================================ */
function buildControl() {
  const el = document.createElement('div');
  el.className = 'mode-control energie-control';

  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'slider-wrap';
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = '0';
  slider.max = String(TEMP_STOPS_HEAT.length - 1);
  slider.step = '1'; slider.className = 'slider';
  slider.addEventListener('input', () => {
    const tC = TEMP_STOPS_HEAT[Number(slider.value)];
    if (tC !== undefined) store.set({ heatTempC: tC });
  });

  const ticks = document.createElement('div');
  ticks.className = 'slider-ticks';
  const tickEls = TEMP_STOPS_HEAT.map((tC) => {
    const span = document.createElement('span');
    span.className = 'slider-tick';
    span.textContent = `${tC > 0 ? '+' : ''}${tC} °C`;
    span.addEventListener('click', () => store.set({ heatTempC: tC }));
    ticks.appendChild(span);
    return span;
  });
  sliderWrap.append(slider, ticks);
  el.appendChild(sliderWrap);

  return {
    el,
    update(s: KioskState, _row: CopRow, _dict: Dict) {
      const idx = TEMP_STOPS_HEAT.indexOf(s.heatTempC);
      if (idx >= 0) slider.value = String(idx);
      tickEls.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    },
  };
}

/* ============================================================ */
function pickRow(tempC: number): CopRow {
  return COP_BY_TEMP_HEAT.find((r) => r.temp === tempC) ?? COP_BY_TEMP_HEAT[0]!;
}
function fmt(n: number): string { return n.toFixed(2); }
