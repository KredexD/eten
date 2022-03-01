import { default as statki_accept } from './statki_accept'
import { default as statki_board } from './statki_board'

interface IButtonInteractions {
    [buttonCustomIdName: string]: Function
}

export const buttonInteractions: IButtonInteractions = {
    'statki_accept': statki_accept,
    'statki_board': statki_board
}