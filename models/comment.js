module.exports = (sequelize, DataTypes) => {
    const comment = sequelize.define('Comment', {
        id: {
            field: 'id',
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            field: 'user_id',
            type: DataTypes.STRING,
            allowNull: false
        },
        postId: {
            field: 'post_id',
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            field: 'content',
            type: DataTypes.TEXT('long'),
            allowNull: false
        },
        creationDate: {
            field: 'creation_date',
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date()
        }
    }, {
            underscored: true,
            freezeTableName: true,
            tableName: 'comment',
            timestamps: false
        });
    return comment;
};