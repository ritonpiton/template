import React from 'react';
import { Route, Switch, withRouter, useHistory } from 'react-router-dom';
import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";
import ImagePopup from "./ImagePopup";
import api from "../utils/api";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import EditProfilePopup from "./EditProfilePopup";
import AddPlacePopup from "./AddPlacePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import Register from "./Register";
import InfoToolTip from "./InfoTooltip";
import * as mestoAuth from "../utils/mestoAuth";

function App() {
    const history = useHistory();
    const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = React.useState(false);
    const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
    const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = React.useState(false);
    const [isInfoToolTipOpen, setIsInfoToolTipOpen] = React.useState(false);
    const [selectedCard, setSelectedCard] = React.useState(null);
    const [currentUser, setCurrentUser] = React.useState({});
    const [cards, setCards] = React.useState([]);
    const [loggedIn, setLoggedIn] = React.useState(false);
    const [isRegistered, setIsRegistered] = React.useState(false);
    const [userEmail, setUserEmail] = React.useState('');

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if(loggedIn) {
            Promise.all([api.getUserInfo(token), api.getInitialCards(token)])
                .then(([ userData, cardsArray ]) => {
                    setCurrentUser(userData);
                    setCards(cardsArray);
                })
                .catch((err) => console.log(`Ошибка инициализации исходных данных \n${err}`));
        }
    },[loggedIn])
    React.useEffect(() => {
        tokenCheck();
    }, [])
    React.useEffect(() => {
        if (isRegistered) {
            history.push('/signin');
            setTimeout(closeAllPopups, 1000)
        }
    }, [isRegistered])

    function handleEditAvatarClick() {
        setIsEditAvatarPopupOpen(true);
    }
    function handleEditProfileClick() {
        setIsEditProfilePopupOpen(true)
    }
    function handleAddPlaceClick() {
       setIsAddPlacePopupOpen(true);
    }
    function handleCardClick(card) {
        setSelectedCard(card);
    }
    function handleCardLike(card) {
        // Снова проверяем, есть ли уже лайк на этой карточке
        const isLiked = card.likes.some(i => i._id === currentUser._id);
        // Отправляем запрос в API и получаем обновлённые данные карточки
        api.changeLikeCardStatus(card._id, isLiked)
            .then((newCard) => {
                setCards((state) => state.map((item) => item._id === card._id ? newCard : item));
            })
            .catch((err) => console.log(`Ошибка лайка карточки \n${err}`))
    }
    function handleCardDelete(card) {
        api.deleteCard(card._id)
            .then(() => {
                setCards((state) => state.filter((item) => !(item._id === card._id) && item))
            })
            .catch((err) => console.log(`Ошибка удаления карточки \n${err}`))
    }
    function handleUpdateUser({name, about}) {
        api.setUserInfo({name, about})
            .then((newUserData) => {
                setCurrentUser(newUserData);
                closeAllPopups();
            })
            .catch((err) => console.log(`Ошибка изменения данных профиля \n${err}`))
    }
    function handleUpdateAvatar(link) {
        api.setUserAvatar(link)
            .then((newUserData) => {
                setCurrentUser(newUserData);
                closeAllPopups();
            })
            .catch((err) => console.log(`Ошибка изменения аватара профиля \n${err}`))
    }
    function handleAddPlaceSubmit(card) {
        api.addCard(card)
            .then((newCard) => {
                setCards([newCard, ...cards]);
                closeAllPopups();
            })
            .catch((err) => console.log(`Ошибка добавления карточки \n${err}`))
    }
    function closeAllPopups() {
        isEditProfilePopupOpen && setIsEditProfilePopupOpen(false);
        isAddPlacePopupOpen && setIsAddPlacePopupOpen(false);
        isEditAvatarPopupOpen && setIsEditAvatarPopupOpen(false);
        selectedCard && setSelectedCard(null);
        isInfoToolTipOpen && setIsInfoToolTipOpen(false);
    }
    function handleLogin(password, email) {
        mestoAuth.authorize(password, email)
            .then((res) => {
                if (res) {
                    localStorage.setItem('token', res.token);
                    setLoggedIn(true);
                    setUserEmail(email);
                    history.push('/');
                }
            })
            .catch(err => console.log(err))
    }
    function handleRegister(password, email) {
        mestoAuth.register(password, email)
            .then((res) => {
                setIsInfoToolTipOpen(true);
                if (res) {
                    setIsRegistered(true);
                }
                else setIsRegistered(false)
            })
            .catch((err) => {
                setIsInfoToolTipOpen(true);
                console.log(err);
            })
    }
    function tokenCheck() {
        const token = localStorage.getItem('token');
        if (token){
            mestoAuth.getContent(token)
                .then((res) => {
                    if (res) {
                        setUserEmail(res.data.email);
                        setLoggedIn(true);
                        history.push('/');
                    }
                })
                .catch(err => console.log(err))
        }
    }
    function signOut() {
        localStorage.removeItem('token');
        history.push('/signin')
    }

    return (
            <CurrentUserContext.Provider value={currentUser}>
                <div className="page">
                    <Header email={userEmail} signOut={signOut}/>
                    <Switch>
                        <ProtectedRoute exact path='/' loggedIn={loggedIn} component={Main} onEditProfile={handleEditProfileClick} onAddPlace={handleAddPlaceClick} onEditAvatar={handleEditAvatarClick} cards={cards} onCardClick={handleCardClick} onCardLike={handleCardLike} onCardDelete={handleCardDelete} />
                        <Route path='/signup'>
                            <Register handleRegister={handleRegister} />
                        </Route>
                        <Route path='/signin'>
                            <Login handleLogin={handleLogin}/>
                        </Route>
                    </Switch>
                    <Footer />
                    <EditProfilePopup isOpen={isEditProfilePopupOpen} onClose={closeAllPopups} onUpdateUser={handleUpdateUser} />
                    <EditAvatarPopup isOpen={isEditAvatarPopupOpen} onClose={closeAllPopups} onUpdateAvatar={handleUpdateAvatar} />
                    <AddPlacePopup isOpen={isAddPlacePopupOpen} onClose={closeAllPopups} onAddCard={handleAddPlaceSubmit} />
                    <ImagePopup card={selectedCard} onClose={closeAllPopups}/>
                    <InfoToolTip isOpen={isInfoToolTipOpen} onClose={closeAllPopups} isRegistered={isRegistered}/>
                </div>
            </CurrentUserContext.Provider>
  );
}

export default withRouter(App);
